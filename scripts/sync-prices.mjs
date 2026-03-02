import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parsePrice(value) {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.'));
}

async function syncPrices() {
  console.log('Fetching from Ministry API...');
  const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ministry API responded ${response.status}`);

  const data = await response.json();
  const listaEESS = data.ListaEESSPrecio;
  console.log(`Received ${listaEESS.length} stations (${data.Fecha})`);

  const stations = [];
  const historyRows = [];
  const today = new Date().toISOString().split('T')[0];

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

  const batchSize = 1000;

  console.log(`Upserting ${stations.length} stations...`);
  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = stations.slice(i, i + batchSize);
    const { error } = await supabase.from('servicestations').upsert(batch, { onConflict: 'id_ss' });
    if (error) throw new Error(`Upsert stations batch ${i}: ${error.message}`);
  }

  console.log(`Upserting ${historyRows.length} price history rows...`);
  for (let i = 0; i < historyRows.length; i += batchSize) {
    const batch = historyRows.slice(i, i + batchSize);
    const { error } = await supabase.from('price_history').upsert(batch, { onConflict: 'station_id,fecha' });
    if (error) throw new Error(`Upsert history batch ${i}: ${error.message}`);
  }

  console.log(`Sync complete: ${stations.length} stations, ${historyRows.length} history rows`);
}

syncPrices().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
