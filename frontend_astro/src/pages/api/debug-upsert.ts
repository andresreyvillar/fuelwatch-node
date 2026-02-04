import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    console.log('[debug-upsert] Testing upsert operation');

    // Fetch Ministry API data
    const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
    const response = await fetch(url);
    const data = await response.json();

    const listaEESS = data.ListaEESSPrecio;
    console.log('[debug-upsert] Got', listaEESS.length, 'stations');

    // Process only first 10 stations for testing
    const testStations = [];
    for (let i = 0; i < Math.min(10, listaEESS.length); i++) {
      const eess = listaEESS[i];
      const parsePrice = (value: string): number => {
        if (!value) return 0;
        return parseFloat(value.replace(',', '.'));
      };

      testStations.push({
        id_ss: parseInt(eess['IDEESS']),
        rotulo: eess['Rótulo'],
        horario: eess['Horario'],
        precio_diesel: parsePrice(eess['Precio Gasoleo A']),
        precio_diesel_extra: parsePrice(eess['Precio Gasoleo Premium']),
        precio_gasolina_95: parsePrice(eess['Precio Gasolina 95 E5']),
        precio_gasolina_98: parsePrice(eess['Precio Gasolina 98 E5']),
        direccion: eess['Dirección'],
        provincia: eess['Provincia'],
        localidad: eess['Localidad'],
        cp: eess['C.P.'],
        longitud: eess['Longitud (WGS84)'],
        latitud: eess['Latitud'],
        fecha_actualizacion: new Date().toISOString(),
      });
    }

    console.log('[debug-upsert] Upserting', testStations.length, 'test stations');
    const { error } = await supabase
      .from('servicestations')
      .upsert(testStations, { onConflict: 'id_ss' });

    if (error) {
      console.error('[debug-upsert] Upsert error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[debug-upsert] Upsert successful');
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Upsert successful',
      stations_upserted: testStations.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[debug-upsert] Unhandled error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      type: error.constructor.name,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
