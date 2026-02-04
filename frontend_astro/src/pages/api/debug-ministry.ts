import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('[debug-ministry] Starting Ministry API test');

    const url = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
    console.log('[debug-ministry] Fetching from:', url);

    const response = await fetch(url);
    console.log('[debug-ministry] Response status:', response.status);
    console.log('[debug-ministry] Response ok:', response.ok);

    if (!response.ok) {
      const text = await response.text();
      console.error('[debug-ministry] Response error:', text.substring(0, 200));
      return new Response(JSON.stringify({
        error: `Ministry API returned ${response.status}`,
        details: text.substring(0, 500)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('[debug-ministry] Response data keys:', Object.keys(data));

    const listaEESS = data.ListaEESSPrecio;
    if (!listaEESS || !Array.isArray(listaEESS)) {
      console.error('[debug-ministry] ListaEESSPrecio not found or not an array');
      return new Response(JSON.stringify({
        error: 'ListaEESSPrecio not found or not an array',
        data_keys: Object.keys(data)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[debug-ministry] Found', listaEESS.length, 'stations');

    return new Response(JSON.stringify({
      status: 'ok',
      station_count: listaEESS.length,
      sample_station: listaEESS[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[debug-ministry] Unhandled error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      type: error.constructor.name
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
