import type { APIRoute } from 'astro';
import { findStationsAlongRoute, RouteNotFoundError, RoutingUnavailableError } from '../../lib/fuel';
import type { ProvinceSortFuel } from '../../lib/provinces';
import type { LonLat } from '../../lib/route';

const ROUTE_RADII_KM = new Map([['1', 1], ['2', 2], ['5', 5], ['10', 10]]);
const ROUTE_FUELS: readonly string[] = ['diesel', 'gas95'] satisfies ProvinceSortFuel[];
const COORDINATES = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/;
// España con Canarias, Ceuta y Melilla (la misma caja que usa Photon en el navegador).
const SPAIN = { minLon: -18.3, maxLon: 4.4, minLat: 27.6, maxLat: 43.9 };
// Las rutas no cambian: la CDN puede servir la misma respuesta durante una hora sin volver a OSRM.
const CACHE_SECONDS = 3600;

const json = (body: unknown, status: number, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

// "lon,lat" dentro de España → [lon, lat]; cualquier otra cosa → null.
const parseLonLat = (value: string | null): LonLat | null => {
  const match = value?.match(COORDINATES);
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  const inSpain = lon >= SPAIN.minLon && lon <= SPAIN.maxLon && lat >= SPAIN.minLat && lat <= SPAIN.maxLat;
  return inSpain ? [lon, lat] : null;
};

const isRouteFuel = (fuel: string | null): fuel is ProvinceSortFuel => fuel !== null && ROUTE_FUELS.includes(fuel);

export const GET: APIRoute = async ({ url }) => {
  const from = parseLonLat(url.searchParams.get('from'));
  const to = parseLonLat(url.searchParams.get('to'));
  const radiusKm = ROUTE_RADII_KM.get(url.searchParams.get('radius') ?? '');
  const fuel = url.searchParams.get('fuel');

  if (!from) return json({ error: 'Invalid from' }, 400);
  if (!to) return json({ error: 'Invalid to' }, 400);
  if (radiusKm === undefined) return json({ error: 'Invalid radius' }, 400);
  if (!isRouteFuel(fuel)) return json({ error: 'Invalid fuel' }, 400);

  try {
    return json(await findStationsAlongRoute(from, to, radiusKm, fuel), 200, { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` });
  } catch (error: any) {
    if (error instanceof RouteNotFoundError) return json({ error: 'No route' }, 404);
    if (error instanceof RoutingUnavailableError) return json({ error: 'Routing unavailable' }, 502);
    return json({ error: error.message }, 500);
  }
};
