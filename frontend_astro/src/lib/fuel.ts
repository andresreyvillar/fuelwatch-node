import { supabase } from './supabase';
import { matchProvinces, PROVINCE_SORT_COLUMNS, type ProvinceSortFuel, type Suggestion } from './provinces';

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

