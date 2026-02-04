import type { APIRoute } from 'astro';
import { searchStations } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('target') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
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
