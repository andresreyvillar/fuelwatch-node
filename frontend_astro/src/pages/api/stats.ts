import type { APIRoute } from 'astro';
import { getStats } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const location = url.searchParams.get('location') || '';

  try {
    const result = await getStats(location);
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
