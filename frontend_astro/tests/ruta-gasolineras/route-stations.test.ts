import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

type RouteStation = { id_ss: number; kmRuta: number; desvioKm: number; masBarataDelTramo: boolean };
type RouteBody = { route: { distanceKm: number; durationMin: number; geometry: [number, number][] }; stations: RouteStation[] };

import { GET } from '../../src/pages/api/route-stations';

type GetContext = Parameters<typeof GET>[0];

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

type OsrmBehaviour = 'ok' | 'no-route' | 'snapped-far' | 'ferry' | 'too-long' | 'down' | 'unreachable' | 'hangs' | 'no-geometry';

// OSRM devuelve la geometría como polyline con 6 decimales (lat, lon), igual que con geometries=polyline6.
const encodePolyline6 = (points: [number, number][]): string => {
  const encodeValue = (value: number): string => {
    let rest = value < 0 ? ~(value << 1) : value << 1;
    let chunk = '';
    while (rest >= 0x20) { chunk += String.fromCharCode((0x20 | (rest & 0x1f)) + 63); rest >>= 5; }
    return chunk + String.fromCharCode(rest + 63);
  };
  let lastLat = 0, lastLon = 0;
  return points.map(([lon, lat]) => {
    const latE6 = Math.round(lat * 1e6), lonE6 = Math.round(lon * 1e6);
    const encoded = encodeValue(latE6 - lastLat) + encodeValue(lonE6 - lastLon);
    lastLat = latE6; lastLon = lonE6;
    return encoded;
  }).join('');
};

const givenRoutingService = (behaviour: OsrmBehaviour): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (!String(input).startsWith('https://router.project-osrm.org/')) throw new Error(`unexpected fetch ${input}`);
      if (behaviour === 'unreachable') throw new TypeError('fetch failed');
      // Como el OSRM real: sin User-Agent responde 403 (el fetch de Cloudflare Workers no lo pone por defecto).
      if (!new Headers(init?.headers).get('user-agent')) return new Response('<html>403 Forbidden</html>', { status: 403 });
      if (behaviour === 'hangs') {
        return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
      }
      if (behaviour === 'down') return new Response('Service Unavailable', { status: 503 });
      if (behaviour === 'no-route') return new Response(JSON.stringify({ code: 'NoRoute', message: 'Impossible route' }), { status: 400 });
      const geometry = encodePolyline6(routeGeometry());
      const steps = behaviour === 'ferry' ? [{ mode: 'driving' }, { mode: 'ferry' }, { mode: 'driving' }] : [{ mode: 'driving' }];
      const distance = behaviour === 'too-long' ? 1_700_000 : ROUTE_KM * 1000;
      const route = { distance, duration: 2 * 3600, legs: [{ steps }], ...(behaviour === 'no-geometry' ? {} : { geometry }) };
      // OSRM engancha cada punto a la carretera más cercana y dice a qué distancia (m) lo ha movido.
      const snappedMeters = behaviour === 'snapped-far' ? 1_167_915 : 12;
      const waypoints = [{ distance: 8 }, { distance: snappedMeters }];
      return new Response(JSON.stringify({ code: 'Ok', routes: [route], waypoints }));
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
  const response = await GET({ url } as unknown as GetContext);
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
  test('ruta-gasolineras-en-el-corredor: solo las estaciones a la distancia pedida o menos, con su desvío', async () => {
    fakeDatabase.seed('servicestations', [
      stationAt(1, 50, 0.5),
      stationAt(2, 60, -1.9),
      stationAt(3, 70, 2.5),
      stationAt(4, 80, 10),
      stationAt(5, 90, 1.2),
      // Pasado el destino: dentro de la caja del último tramo, pero a √(1,5² + 1,5²) ≈ 2,1 km del final de la ruta.
      stationAt(6, ROUTE_KM + 1.5, 1.5),
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
    expect(idsOf(wide.body)).toEqual([1, 2, 3, 5, 6]);
    expect((narrow.body as RouteBody).route).toMatchObject({ distanceKm: expect.closeTo(222, 0), durationMin: 120 });
  });

  /** @scenarios ruta-ordenada-por-km */
  test('ruta-ordenada-por-km: en el orden en que se encuentran desde el origen, con su km de ruta', async () => {
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
  test('ruta-mas-barata-por-tramo: marca la más barata del carburante elegido en cada tramo de 100 km', async () => {
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
  test('ruta-sin-precio-excluida: sin precio del carburante elegido no aparece', async () => {
    fakeDatabase.seed('servicestations', [stationAt(30, 30, 0.3, 0, 1.6), stationAt(31, 40, 0.3, 1.5, 0)]);

    const diesel = await requestRoute(validParams);
    const gas95 = await requestRoute({ ...validParams, fuel: 'gas95' });

    expect(idsOf(diesel.body)).toEqual([31]);
    expect(idsOf(gas95.body)).toEqual([30]);
  });
});

describe('GET /api/route-stations — errores', () => {
  /** @scenarios ruta-parametros-no-validos */
  test('ruta-parametros-no-validos: 400 con el parámetro inválido', async () => {
    expect(await requestRoute({ ...validParams, from: null })).toEqual({ status: 400, body: { error: 'Invalid from' } });
    expect(await requestRoute({ ...validParams, to: 'madrid' })).toEqual({ status: 400, body: { error: 'Invalid to' } });
    expect(await requestRoute({ ...validParams, from: '-3,95' })).toEqual({ status: 400, body: { error: 'Invalid from' } });
    // Fuera de España (con Canarias): el endpoint no es un proxy de OSRM para cualquier sitio.
    expect(await requestRoute({ ...validParams, from: '139.69,35.68' })).toEqual({ status: 400, body: { error: 'Invalid from' } });
    expect(await requestRoute({ ...validParams, to: '37.62,55.75' })).toEqual({ status: 400, body: { error: 'Invalid to' } });
    expect(await requestRoute({ ...validParams, radius: '3' })).toEqual({ status: 400, body: { error: 'Invalid radius' } });
    expect(await requestRoute({ ...validParams, radius: '2.0' })).toEqual({ status: 400, body: { error: 'Invalid radius' } });
    expect(await requestRoute({ ...validParams, radius: '02' })).toEqual({ status: 400, body: { error: 'Invalid radius' } });
    expect(await requestRoute({ ...validParams, fuel: 'gas98' })).toEqual({ status: 400, body: { error: 'Invalid fuel' } });
  });

  /** @scenarios ruta-sin-ruta */
  test('ruta-sin-ruta: 404 si no hay ruta por carretera', async () => {
    givenRoutingService('no-route');

    expect(await requestRoute(validParams)).toEqual({ status: 404, body: { error: 'No route' } });
  });

  /** @scenarios ruta-sin-ruta */
  test('ruta-sin-ruta: 404 si OSRM tiene que mover un extremo más de 5 km para llegar a una carretera (p. ej. Canarias)', async () => {
    givenRoutingService('snapped-far');

    expect(await requestRoute(validParams)).toEqual({ status: 404, body: { error: 'No route' } });
  });

  /** @scenarios ruta-sin-ruta */
  test('ruta-sin-ruta: 404 si la ruta incluye un tramo en ferry (p. ej. Palma → Madrid)', async () => {
    givenRoutingService('ferry');

    expect(await requestRoute(validParams)).toEqual({ status: 404, body: { error: 'No route' } });
  });

  /** @scenarios ruta-sin-ruta */
  test('ruta-sin-ruta: 404 si la ruta supera 1.600 km (ninguna ruta dentro de España llega)', async () => {
    givenRoutingService('too-long');

    expect(await requestRoute(validParams)).toEqual({ status: 404, body: { error: 'No route' } });
  });

  /** @scenarios ruta-servicio-no-disponible */
  test('ruta-servicio-no-disponible: 502 si el servicio de rutas falla o no responde', async () => {
    givenRoutingService('down');
    const down = await requestRoute(validParams);
    givenRoutingService('unreachable');
    const unreachable = await requestRoute(validParams);

    expect(down).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
    expect(unreachable).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
  });

  /** @scenarios ruta-servicio-no-disponible */
  test('ruta-servicio-no-disponible: 502 si OSRM no contesta en 10 s o contesta sin geometría', async () => {
    givenRoutingService('no-geometry');
    const withoutGeometry = await requestRoute(validParams);

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    givenRoutingService('hangs');
    const pending = requestRoute(validParams);
    await vi.advanceTimersByTimeAsync(10_000);
    const hanging = await pending;
    vi.useRealTimers();

    expect(withoutGeometry).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
    expect(hanging).toEqual({ status: 502, body: { error: 'Routing unavailable' } });
  });
});
