import type { APIRoute } from 'astro';
import { getStationHistory } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  try {
    const history = await getStationHistory(parseInt(id));
    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
