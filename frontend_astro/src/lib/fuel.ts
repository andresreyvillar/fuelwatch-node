import { supabase } from './supabase';

function checkSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your environment variables.');
  return supabase;
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
      longitud: eess['Longitud (WGS84)'],
      latitud: eess['Latitud'],
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

export async function searchStations(query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const client = checkSupabase();
  const orConditions = getSearchConditions(query);
  
  const { data, count, error } = await client
    .from('servicestations')
    .select('*', { count: 'exact' })
    .or(orConditions)
    .order('cp', { ascending: true })
    .range(skip, skip + limit - 1);

  if (error) throw error;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const stationIds = data.map(s => s.id_ss);
  const { data: historyData } = await client
    .from('price_history')
    .select('station_id, diesel, diesel_extra, gas95, gas98')
    .in('station_id', stationIds)
    .eq('fecha', yesterdayStr);

  const trends: Record<number, any> = {};
  historyData?.forEach(h => {
    trends[h.station_id] = h;
  });

  const dataWithTrends = data.map(s => ({
    ...s,
    trend: trends[s.id_ss] || null
  }));

  return { data: dataWithTrends, meta: { total: count || 0, page, lastPage: Math.ceil((count || 0) / limit) } };
}

export async function getStats(location: string) {
  const client = checkSupabase();
  const orConditions = getSearchConditions(location);
  const { data, error } = await client.from('servicestations').select('precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98').or(orConditions);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const dieselArr = data.map(s => s.precio_diesel).filter(p => p > 0);
  const gas95Arr = data.map(s => s.precio_gasolina_95).filter(p => p > 0);
  const getAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  return {
    diesel: { avg: getAvg(dieselArr), min: Math.min(...dieselArr) || 0, max: Math.max(...dieselArr) || 0 },
    gas95: { avg: getAvg(gas95Arr), min: Math.min(...gas95Arr) || 0, max: Math.max(...gas95Arr) || 0 }
  };
}

function getSearchConditions(query: string): string {
  const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
  const upperQuery = query.toUpperCase();
  let coreName = query.replace(/\(.*\)/g, '').trim();
  for (const art of articles) {
    if (coreName.toUpperCase().startsWith(art)) coreName = coreName.slice(art.length).trim();
  }
  let conditions = [
    `localidad.ilike.%${query}%`,
    `cp.ilike.%${query}%`
  ];
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
