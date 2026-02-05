import type { APIRoute } from 'astro';
import { searchStations, getStationsByIds } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const idsParam = url.searchParams.get('ids');
  const query = url.searchParams.get('target') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      const result = await getStationsByIds(ids);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await searchStations(query, page, limit);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
