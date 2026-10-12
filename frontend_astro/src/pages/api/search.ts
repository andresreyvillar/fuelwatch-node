import type { APIRoute } from 'astro';
import { searchStations, getStationsByIds, searchStationsByProvince } from '../../lib/fuel';
import type { ProvinceSortFuel } from '../../lib/provinces';

const PROVINCE_SORT_FUELS: readonly string[] = ['diesel', 'gas95'] satisfies ProvinceSortFuel[];

const isProvinceSortFuel = (fuel: string | null): fuel is ProvinceSortFuel => fuel !== null && PROVINCE_SORT_FUELS.includes(fuel);

export const GET: APIRoute = async ({ url }) => {
  const idsParam = url.searchParams.get('ids');
  const query = url.searchParams.get('target') || '';
  const province = url.searchParams.get('province');
  const fuel = url.searchParams.get('fuel');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  if (province && !isProvinceSortFuel(fuel)) {
    return new Response(JSON.stringify({ error: 'Invalid fuel' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (province && isProvinceSortFuel(fuel)) {
      const result = await searchStationsByProvince(province, fuel, page, limit);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
