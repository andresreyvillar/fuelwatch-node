import type { APIRoute } from 'astro';
import { getProvinceStats, getStats } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const location = url.searchParams.get('location') || '';
  const province = url.searchParams.get('province');

  try {
    const result = province ? await getProvinceStats(province) : await getStats(location);
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
