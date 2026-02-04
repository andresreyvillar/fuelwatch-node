import { supabase } from './supabase';

function checkSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your environment variables.');
  return supabase;
}

export async function updateDataFromMinistry() {
  // Ministry API URL - hardcoded since Cloudflare Pages doesn't inject env vars in SSR runtime
  const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

  const response = await fetch(url);
  const data = await response.json();
  
  const listaEESS = data.ListaEESSPrecio;
  const stations = [];
  const historyData: Record<number, number[]> = {};

  for (const eess of listaEESS) {
    const id = parseInt(eess['IDEESS']);
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
    
    historyData[id] = [diesel, dieselExtra, gas95, gas98];
  }

  const client = checkSupabase();
  const { error: stationError } = await client
    .from('servicestations')
    .upsert(stations, { onConflict: 'id_ss' });

  if (stationError) throw stationError;

  const today = new Date().toISOString().split('T')[0];
  const { error: historyError } = await client
    .from('historico')
    .upsert({
      fecha: today,
      datos: historyData,
    }, { onConflict: 'fecha' });

  if (historyError) throw historyError;

  return { success: true, count: stations.length };
}

function parsePrice(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.'));
}

export async function searchStations(query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const client = checkSupabase();
  
  const { data, count, error } = await client
    .from('servicestations')
    .select('*', { count: 'exact' })
    .or(`localidad.ilike.%${query}%,cp.ilike.%${query}%`)
    .order('cp', { ascending: true })
    .range(skip, skip + limit - 1);

  if (error) throw error;

  return {
    data,
    meta: {
      total: count || 0,
      page,
      lastPage: Math.ceil((count || 0) / limit),
    }
  };
}

export async function getStats(location: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('servicestations')
    .select('precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98')
    .or(`localidad.ilike.%${location}%,cp.ilike.%${location}%`);

  if (error) throw error;

  if (!data || data.length === 0) return null;

  const dieselArr = data.map(s => s.precio_diesel).filter(p => p > 0);
  const gas95Arr = data.map(s => s.precio_gasolina_95).filter(p => p > 0);
  const dieselExtraArr = data.map(s => s.precio_diesel_extra).filter(p => p > 0);
  const gas98Arr = data.map(s => s.precio_gasolina_98).filter(p => p > 0);

  const getAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    diesel: {
      avg: getAvg(dieselArr),
      min: Math.min(...dieselArr) || 0,
      max: Math.max(...dieselArr) || 0,
    },
    gas95: {
      avg: getAvg(gas95Arr),
      min: Math.min(...gas95Arr) || 0,
      max: Math.max(...gas95Arr) || 0,
    },
    diesel_extra: { avg: getAvg(dieselExtraArr) },
    gas98: { avg: getAvg(gas98Arr) },
  };
}
