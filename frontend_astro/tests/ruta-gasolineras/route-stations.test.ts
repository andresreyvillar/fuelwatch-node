import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

type RouteStation = { id_ss: number; kmRuta: number; desvioKm: number; masBarataDelTramo: boolean };
type RouteBody = { route: { distanceKm: number; durationMin: number; geometry: [number, number][] }; stations: RouteStation[] };
type Endpoint = { GET: (context: unknown) => Promise<Response> };

// El endpoint aún no existe: se importa por ruta en una variable para que tsc no falle antes de crearlo.
const endpointPath = '../../src/pages/api/route-stations';
const loadEndpoint = async (): Promise<Endpoint> => (await import(/* @vite-ignore */ endpointPath)) as Endpoint;

// Ruta de prueba: recta hacia el norte por el meridiano -3, desde (40°N) durante 222 km, con un punto por km.
const ORIGIN = { lon: -3, lat: 40 };
const KM_PER_DEGREE_LAT = 111.195;
const ROUTE_KM = 222;

const pointAt = (kmAlongRoute: number, kmEast = 0): { lon: number; lat: number } => {
  const lat = ORIGIN.lat + kmAlongRoute / KM_PER_DEGREE_LAT;
  const lon = ORIGIN.lon + kmEast / (KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  return { lon, lat };
};

const routeGeometry = (): [number, number][] =>
  Array.from({ length: ROUTE_KM + 1 }, (_, km) => {
    const { lon, lat } = pointAt(km);
    return [lon, lat];
  });

type OsrmBehaviour = 'ok' | 'no-route' | 'down' | 'unreachable';

const givenRoutingService = (behaviour: OsrmBehaviour): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      if (!String(input).startsWith('https://router.project-osrm.org/')) throw new Error(`unexpected fetch ${input}`);
      if (behaviour === 'unreachable') throw new TypeError('fetch failed');
      if (behaviour === 'down') return new Response('Service Unavailable', { status: 503 });
      if (behaviour === 'no-route') return new Response(JSON.stringify({ code: 'NoRoute', message: 'Impossible route' }), { status: 400 });
      const route = { distance: ROUTE_KM * 1000, duration: 2 * 3600, geometry: { type: 'LineString', coordinates: routeGeometry() } };
      return new Response(JSON.stringify({ code: 'Ok', routes: [route] }));
    }),
  );
};

const stationAt = (id: number, kmAlongRoute: number, kmEast: number, diesel = 1.5, gas95 = 1.6) => {
  const { lon, lat } = pointAt(kmAlongRoute, kmEast);
  return {
    id_ss: id,
    rotulo: `ESTACION ${id}`,
    localidad: 'LOCALIDAD',
    provincia: 'MADRID',
    cp: '28000',
    latitud: lat,
    longitud: lon,
    precio_diesel: diesel,
    precio_diesel_extra: 0,
    precio_gasolina_95: gas95,
    precio_gasolina_98: 0,
  };
};

const validParams = { from: `${ORIGIN.lon},${ORIGIN.lat}`, to: `${pointAt(ROUTE_KM).lon},${pointAt(ROUTE_KM).lat}`, radius: '2', fuel: 'diesel' };

const requestRoute = async (params: Record<string, string | null>): Promise<{ status: number; body: unknown }> => {
  const url = new URL('http://localhost/api/route-stations');
  Object.entries(params).forEach(([name, value]) => value !== null && url.searchParams.set(name, value));
  const { GET } = await loadEndpoint();
  const response = await GET({ url });
  return { status: response.status, body: await response.json() };
};

const stationsOf = (body: unknown): RouteStation[] => (body as RouteBody).stations;
const idsOf = (body: unknown): number[] => stationsOf(body).map((station) => station.id_ss);

beforeEach(() => {
  fakeDatabase.reset();
  givenRoutingService('ok');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/route-stations — gasolineras en el corredor de la ruta', () => {
  /** @scenarios ruta-gasolineras-en-el-corredor */
  test.fails('ruta-gasolineras-en-el-corredor: solo las estaciones a la distancia pedida o menos, con su desvío', async () => {
    fakeDatabase.seed('servicestations', [
      stationAt(1, 50, 0.5),
      stationAt(2, 60, -1.9),
      stationAt(3, 70, 2.5),
      stationAt(4, 80, 10),
      stationAt(5, 90, 1.2),
    ]);

    const narrow = await requestRoute(validParams);
    const wide = await requestRoute({ ...validParams, radius: '5' });

    expect(narrow.status).toBe(200);
    expect(idsOf(narrow.body)).toEqual([1, 2, 5]);
    expect(stationsOf(narrow.body).map((station) => station.desvioKm)).toEqual([
      expect.closeTo(0.5, 1),
      expect.closeTo(1.9, 1),
      expect.closeTo(1.2, 1),
    ]);
    expect(idsOf(wide.body)).toEqual([1, 2, 3, 5]);
    expect((narrow.body as RouteBody).route).toMatchObject({ distanceKm: expect.closeTo(222, 0), durationMin: 120 });
  });

  /** @scenarios ruta-ordenada-por-km */
  test.fails('ruta-ordenada-por-km: en el orden en que se encuentran desde el origen, con su km de ruta', async () => {
    fakeDatabase.seed('servicestations', [stationAt(10, 150, 0.3), stationAt(11, 20, 0.3), stationAt(12, 80, 0.3)]);

    const { status, body } = await requestRoute(validParams);

    expect(status).toBe(200);
    expect(idsOf(body)).toEqual([11, 12, 10]);
    expect(stationsOf(body).map((station) => station.kmRuta)).toEqual([
      expect.closeTo(20, 0),
      expect.closeTo(80, 0),
      expect.closeTo(150, 0),
    ]);
  });

  /** @scenarios ruta-mas-barata-por-tramo */
  test.fails('ruta-mas-barata-por-tramo: marca la más barata del carburante elegido en cada tramo de 100 km', async () => {
    fakeDatabase.seed('servicestations', [
      stationAt(20, 10, 0.3, 1.5, 1.3),
      stationAt(21, 50, 0.3, 1.4, 1.7),
      stationAt(22, 120, 0.3, 1.6, 1.5),
      stationAt(23, 180, 0.3, 1.55, 1.9),
    ]);

    const diesel = await requestRoute(validParams);
    const gas95 = await requestRoute({ ...validParams, fuel: 'gas95' });

    const cheapest = (body: unknown) => stationsOf(body).filter((station) => station.masBarataDelTramo).map((station) => station.id_ss);
    expect(cheapest(diesel.body)).toEqual([21, 23]);
    expect(cheapest(gas95.body)).toEqual([20, 22]);
    expect(stationsOf(diesel.body)).toHaveLength(4);
  });

  /** @scenarios ruta-sin-precio-excluida */
  test.fails('ruta-sin-precio-excluida: sin precio del carburante elegido no aparece', async () => {
    fakeDatabase.seed('servicestations', [stationAt(30, 30, 0.3, 0, 1.6), stationAt(31, 40, 0.3, 1.5, 0)]);

    const diesel = await requestRoute(validParams);
    const gas95 = await requestRoute({ ...validParams, fuel: 'gas95' });

    expect(idsOf(diesel.body)).toEqual([31]);
    expect(idsOf(gas95.body)).toEqual([30]);
  });
});

describe('GET /api/route-stations — errores', () => {
  /** @scenarios ruta-parametros-no-validos */
  test.fails('ruta-parametros-no-validos: 400 con el parámetro inválido', async () => {
    expect(await requestRoute({ ...validParams, from: null })).toEqual({ status: 400, body: { error: 'Invalid from' } });
    expect(await requestRoute({ ...validParams, to: 'madrid' })).toEqual({ status: 400, body: { error: 'Invalid to' } });
    expect(await requestRoute({ ...validParams, from: '-3,95' })).toEqual({ status: 400, body: { error: 'Invalid from' } });
    expect(await requestRoute({ ...validParams, radius: '3' })).toEqual({ status: 400, body: { error: 'Invalid radius' } });
    expect(await requestRoute({ ...validParams, fuel: 'gas98' })).toEqual({ status: 400, body: { error: 'Invalid fuel' } });
  });

  /** @scenarios ruta-sin-ruta */
  test.fails('ruta-sin-ruta: 404 si no hay ruta por carretera', async () => {
    givenRoutingService('no-route');

    expect(await requestRoute(validParams)).toEqual({ status: 404, body: { error: 'No route' } });
  });

  /** @scenarios ruta-servicio-no-disponible */
  test.fails('ruta-servicio-no-disponible: 502 si el servicio de rutas falla o no responde', async () => {
    givenRoutingService('down');
    const down = await requestRoute(validParams);
    givenRoutingService('unreachable');
    const unreachable = await requestRoute(validParams);

    expect(down).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
    expect(unreachable).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
  });
});
