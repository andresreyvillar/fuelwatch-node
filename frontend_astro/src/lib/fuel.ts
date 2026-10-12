import { supabase } from './supabase';
import { matchProvinces, PROVINCE_SORT_COLUMNS, type ProvinceSortFuel, type Suggestion } from './provinces';
import { boxAround, cheapestPerSection, chunkRanges, cumulativeKm, decodePolyline6, locateInSpan, projectSpan, simplifyForDrawing, type LonLat } from './route';

function checkSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your environment variables.');
  return supabase;
}

const DECIMAL = /^-?\d+(\.\d+)?$/;

// "42,240611" → 42.240611; vacío, solo espacios o no decimal → null. Misma regla que scripts/sync-prices.mjs.
function parseCoordinate(value: string | undefined): number | null {
  const normalized = String(value ?? '').trim().replace(',', '.');
  return DECIMAL.test(normalized) ? Number(normalized) : null;
}

export async function updateDataFromMinistry() {
  const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
  const response = await fetch(url);
  const data = await response.json();
  const listaEESS = data.ListaEESSPrecio;
  const stations = [];
  const historyRows = [];
  const today = new Date().toISOString().split('T')[0];

  for (const eess of listaEESS) {
    const id = parseInt(eess['IDEESS']);
    const parsePrice = (value: string): number => {
      if (!value) return 0;
      return parseFloat(value.replace(',', '.'));
    };
    const diesel = parsePrice(eess['Precio Gasoleo A']);
    const dieselExtra = parsePrice(eess['Precio Gasoleo Premium']);
    const gas95 = parsePrice(eess['Precio Gasolina 95 E5']);
    const gas98 = parsePrice(eess['Precio Gasolina 98 E5']);

    stations.push({
      id_ss: id,
      rotulo: eess['Rótulo'],
      horario: eess['Horario'],
      precio_diesel: diesel,
      precio_diesel_extra: dieselExtra,
      precio_gasolina_95: gas95,
      precio_gasolina_98: gas98,
      direccion: eess['Dirección'],
      provincia: eess['Provincia'],
      localidad: eess['Localidad'],
      cp: eess['C.P.'],
      longitud: parseCoordinate(eess['Longitud (WGS84)']),
      latitud: parseCoordinate(eess['Latitud']),
      fecha_actualizacion: new Date().toISOString(),
    });

    if (diesel > 0 || gas95 > 0 || dieselExtra > 0 || gas98 > 0) {
      historyRows.push({
        station_id: id,
        fecha: today,
        diesel: diesel > 0 ? diesel : null,
        diesel_extra: dieselExtra > 0 ? dieselExtra : null,
        gas95: gas95 > 0 ? gas95 : null,
        gas98: gas98 > 0 ? gas98 : null
      });
    }
  }

  const client = checkSupabase();
  const batchSize = 1000;
  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = stations.slice(i, i + batchSize);
    await client.from('servicestations').upsert(batch, { onConflict: 'id_ss' });
  }

  for (let i = 0; i < historyRows.length; i += batchSize) {
    const batch = historyRows.slice(i, i + batchSize);
    await client.from('price_history').upsert(batch, { onConflict: 'station_id,fecha' });
  }

  return { success: true, count: stations.length };
}

async function attachTrends(data: any[]) {
  if (!data || data.length === 0) return data;
  const client = checkSupabase();
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 3);
  const daysAgoStr = daysAgo.toISOString().split('T')[0];
  const stationIds = data.map(s => s.id_ss);
  const { data: historyData } = await client
    .from('price_history')
    .select('station_id, fecha, diesel, diesel_extra, gas95, gas98')
    .in('station_id', stationIds)
    .lte('fecha', daysAgoStr)
    .order('fecha', { ascending: false })
    .limit(stationIds.length);
  const trends: Record<number, any> = {};
  historyData?.forEach(h => {
    if (!trends[h.station_id]) trends[h.station_id] = h;
  });
  return data.map(s => ({ ...s, trend: trends[s.id_ss] || null }));
}

const HISTORY_WINDOW_DAYS = 30;

export async function getStationHistory(id: number) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('price_history')
    .select('fecha, diesel, gas95, diesel_extra, gas98')
    .eq('station_id', id)
    .gte('fecha', historyWindowStart())
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data;
}

function historyWindowStart(): string {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (HISTORY_WINDOW_DAYS - 1));
  return start.toISOString().split('T')[0];
}

export async function getStationsByIds(ids: number[]) {
  const client = checkSupabase();
  const { data, error } = await client.from('servicestations').select('*').in('id_ss', ids);
  if (error) throw error;
  const withTrends = await attachTrends(data);
  return { data: withTrends };
}

export async function searchStations(query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const client = checkSupabase();
  const orConditions = getSearchConditions(query);
  const { data, count, error } = await client.from('servicestations').select('*', { count: 'exact' }).or(orConditions).order('cp', { ascending: true }).range(skip, skip + limit - 1);
  if (error) throw error;
  const withTrends = await attachTrends(data);
  return { data: withTrends, meta: { total: count || 0, page, lastPage: Math.ceil((count || 0) / limit) } };
}

const STATS_FUEL_COLUMNS = [
  ['diesel', 'precio_diesel'],
  ['diesel_extra', 'precio_diesel_extra'],
  ['gas95', 'precio_gasolina_95'],
  ['gas98', 'precio_gasolina_98'],
] as const;

type FuelStats = { min: number; max: number; avg: number };
type Stats = Partial<Record<(typeof STATS_FUEL_COLUMNS)[number][0], FuelStats>>;
type StationPrices = Record<(typeof STATS_FUEL_COLUMNS)[number][1], number>;

export async function getStats(location: string): Promise<Stats | null> {
  const client = checkSupabase();
  const orConditions = getSearchConditions(location);
  const { data, error } = await client.from('servicestations').select('precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98').or(orConditions);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return buildStats(data);
}

export async function getProvinceStats(province: string): Promise<Stats | null> {
  const client = checkSupabase();
  const { data, error } = await client.from('servicestations').select('precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98').eq('provincia', province);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return buildStats(data);
}

export async function searchStationsByProvince(province: string, fuel: ProvinceSortFuel, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const priceColumn = PROVINCE_SORT_COLUMNS[fuel];
  const client = checkSupabase();
  const { data, count, error } = await client.from('servicestations').select('*', { count: 'exact' }).eq('provincia', province).gt(priceColumn, 0).order(priceColumn, { ascending: true }).order('id_ss', { ascending: true }).range(skip, skip + limit - 1);
  if (error) throw error;
  const withTrends = await attachTrends(data);
  return { data: withTrends, meta: { total: count || 0, page, lastPage: Math.ceil((count || 0) / limit) } };
}

export async function getSuggestions(query: string): Promise<Suggestion[]> {
  if (query.trim().length < 2) return [];
  const localities = await findLocalities(query);
  return [
    ...matchProvinces(query).map((nombre): Suggestion => ({ tipo: 'provincia', nombre })),
    ...localities.map((nombre): Suggestion => ({ tipo: 'localidad', nombre })),
  ];
}

// PostgREST: entre comillas dobles, comas y paréntesis son literales; solo hay que escapar " y \.
function quoteFilterValue(value: string): string {
  return `"${value.replace(/["\\]/g, '\\$&')}"`;
}

async function findLocalities(query: string): Promise<string[]> {
  const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
  const orConditions = [`localidad.ilike.${quoteFilterValue(`%${query}%`)}`];
  const upperQuery = query.toUpperCase();
  for (const art of articles) {
    if (upperQuery.startsWith(art)) {
      const mainName = query.slice(art.length).trim();
      // Format for DB: "NAME (ART)"
      orConditions.push(`localidad.ilike.${quoteFilterValue(`%${mainName}%${art.trim()}%`)}`);
    }
  }
  const client = checkSupabase();
  const { data, error } = await client.from('servicestations').select('localidad').or(orConditions.join(',')).limit(100);
  if (error) throw error;
  const uniqueLocations = Array.from(new Set(data.map(item => item.localidad))).sort();
  return uniqueLocations.slice(0, 10);
}

function buildStats(stations: StationPrices[]): Stats | null {
  const entries = STATS_FUEL_COLUMNS.flatMap(([fuel, column]) => {
    const stats = summarizePrices(stations.map(station => station[column]));
    return stats ? [[fuel, stats] as const] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function summarizePrices(prices: number[]): FuelStats | null {
  const validPrices = prices.filter(price => price > 0);
  if (validPrices.length === 0) return null;
  const total = validPrices.reduce((sum, price) => sum + price, 0);
  return { min: Math.min(...validPrices), max: Math.max(...validPrices), avg: total / validPrices.length };
}

function getSearchConditions(query: string): string {
  const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
  const upperQuery = query.toUpperCase();
  let coreName = query.replace(/\(.*\)/g, '').trim();
  for (const art of articles) {
    if (coreName.toUpperCase().startsWith(art)) coreName = coreName.slice(art.length).trim();
  }
  let conditions = [`localidad.ilike.%${query}%` , `cp.ilike.%${query}%` ];
  if (coreName && coreName !== query) conditions.push(`localidad.ilike.%${coreName}%`);
  for (const art of articles) {
    if (upperQuery.startsWith(art)) {
      const mainPart = query.slice(art.length).trim();
      conditions.push(`localidad.ilike.%${mainPart} (${art.trim()})%`);
    }
  }
  const parenMatch = query.match(/(.+) \((.+\))$/);
  if (parenMatch) {
    const name = parenMatch[1].trim();
    conditions.push(`localidad.ilike.%${name}%`);
  }
  return conditions.map(c => c.replace(/\(/g, '\\(').replace(/\)/g, '\\)')).join(',');
}


export class RouteNotFoundError extends Error {}
export class RoutingUnavailableError extends Error {}

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';
const ROUTE_STATION_COLUMNS = 'id_ss, rotulo, horario, direccion, provincia, localidad, cp, latitud, longitud, precio_diesel, precio_diesel_extra, precio_gasolina_95, precio_gasolina_98, fecha_actualizacion';

// OSRM engancha cada extremo a la carretera más cercana, aunque esté a cientos de km (p. ej. Canarias → Portugal).
const MAX_SNAP_METERS = 5000;
const OSRM_TIMEOUT_MS = 10_000;
// Ninguna ruta por carretera dentro de España llega (la más larga, ~1.500 km): por encima no es un viaje español.
const MAX_ROUTE_METERS = 1_600_000;
// OSRM responde 403 sin User-Agent y el fetch de Cloudflare Workers no lo pone; su política pide identificar la app.
const OSRM_HEADERS = { 'User-Agent': 'FuelWatch/1.0 (+https://fuelwatch.pages.dev)' };

type OsrmRoute = { distance: number; duration: number; geometry: LonLat[] };
type RouteStation = Record<string, unknown> & { id_ss: number; latitud: number; longitud: number; kmRuta: number; desvioKm: number };

async function fetchRoute(from: LonLat, to: LonLat): Promise<OsrmRoute> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  let response: Response;
  let body: any;
  try {
    // polyline6 + steps: geometría compacta y el modo de cada paso (para descartar ferris).
    response = await fetch(`${OSRM_ROUTE_URL}/${from.join(',')};${to.join(',')}?overview=full&geometries=polyline6&steps=true`, { signal: controller.signal, headers: OSRM_HEADERS });
    body = await response.json().catch(() => null);
  } catch (error) {
    throw new RoutingUnavailableError('Routing service unreachable', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
  const snappedTooFar = body?.waypoints?.some((waypoint: { distance: number }) => waypoint.distance > MAX_SNAP_METERS);
  if (body?.code === 'NoRoute' || body?.code === 'NoSegment' || snappedTooFar) throw new RouteNotFoundError('No route');
  const route = body?.routes?.[0];
  const geometry = typeof route?.geometry === 'string' ? decodePolyline6(route.geometry) : [];
  if (!response.ok || body?.code !== 'Ok' || geometry.length < 2) {
    throw new RoutingUnavailableError(`Routing service responded ${response.status}`);
  }
  // Decisión del humano: una ruta con barco no es «por carretera».
  const usesFerry = route.legs?.some((leg: { steps?: { mode: string }[] }) => leg.steps?.some((step) => step.mode === 'ferry'));
  if (usesFerry || route.distance > MAX_ROUTE_METERS) throw new RouteNotFoundError('No route');
  return { distance: route.distance, duration: route.duration, geometry };
}

const roundTo2 = (value: number): number => Math.round(value * 100) / 100;

export async function findStationsAlongRoute(from: LonLat, to: LonLat, radiusKm: number, fuel: ProvinceSortFuel) {
  const route = await fetchRoute(from, to);
  const line = route.geometry;
  const cumKm = cumulativeKm(line);
  const priceColumn = PROVINCE_SORT_COLUMNS[fuel];
  const ranges = chunkRanges(cumKm);
  const client = checkSupabase();

  const stationsByChunk = await Promise.all(ranges.map(async ([start, end]) => {
    const box = boxAround(line.slice(start, end + 1), radiusKm);
    const { data, error } = await client.from('servicestations').select(ROUTE_STATION_COLUMNS)
      .gte('latitud', box.minLat).lte('latitud', box.maxLat).gte('longitud', box.minLon).lte('longitud', box.maxLon)
      .gt(priceColumn, 0);
    if (error) throw error;
    return (data ?? []) as unknown as RouteStation[];
  }));

  // Cada estación se mide solo contra el tramo de su caja: si está a ≤ radio de un segmento de otro tramo, también
  // cae en la caja de ese tramo y se mide allí. Si aparece en varias cajas, se queda la posición más cercana.
  const closestById = new Map<number, RouteStation>();
  stationsByChunk.forEach((stations, chunk) => {
    if (stations.length === 0) return;
    const span = projectSpan(line, ranges[chunk][0], ranges[chunk][1]);
    for (const station of stations) {
      const position = locateInSpan([station.longitud, station.latitud], span, cumKm);
      const previous = closestById.get(station.id_ss);
      if (position.desvioKm <= radiusKm && (!previous || position.desvioKm < previous.desvioKm)) {
        closestById.set(station.id_ss, { ...station, kmRuta: position.kmRuta, desvioKm: position.desvioKm });
      }
    }
  });

  // Se redondea antes de agrupar por tramo, para que el tramo cuadre con el kmRuta que se devuelve.
  const stations = [...closestById.values()]
    .sort((a, b) => a.kmRuta - b.kmRuta)
    .map((station): RouteStation => ({ ...station, kmRuta: roundTo2(station.kmRuta), desvioKm: roundTo2(station.desvioKm) }));
  const cheapest = cheapestPerSection(stations.map((station) => ({ kmRuta: station.kmRuta, price: Number(station[priceColumn]) })));
  return {
    route: { distanceKm: Math.round(route.distance / 100) / 10, durationMin: Math.round(route.duration / 60), geometry: simplifyForDrawing(line, cumKm) },
    stations: stations.map((station, index) => ({ ...station, masBarataDelTramo: cheapest[index] })),
  };
}
