import { beforeEach, describe, expect, test, vi } from 'vitest';

type StationPrices = {
  precio_diesel: number;
  precio_diesel_extra: number;
  precio_gasolina_95: number;
  precio_gasolina_98: number;
};

type QueryResult = { data: StationPrices[] | null; error: { message: string } | null };

const supabaseResponse = vi.hoisted(() => ({
  current: { data: [], error: null } as { data: unknown[] | null; error: { message: string } | null },
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        or: async () => supabaseResponse.current,
      }),
    }),
  },
}));

import { GET } from '../../src/pages/api/stats';

type GetContext = Parameters<typeof GET>[0];

const station = (diesel: number, dieselExtra: number, gas95: number, gas98: number): StationPrices => ({
  precio_diesel: diesel,
  precio_diesel_extra: dieselExtra,
  precio_gasolina_95: gas95,
  precio_gasolina_98: gas98,
});

const givenSupabaseReturns = (result: QueryResult): void => {
  supabaseResponse.current = result;
};

const requestStats = async (location: string): Promise<{ status: number; body: unknown }> => {
  const context = { url: new URL(`http://localhost/api/stats?location=${encodeURIComponent(location)}`) };
  const response = await GET(context as unknown as GetContext);
  return { status: response.status, body: await response.json() };
};

const fuelStats = (min: number, max: number, avg: number) => ({ min, max, avg: expect.closeTo(avg, 6) });

describe('GET /api/stats — estadística de zona con los cuatro carburantes', () => {
  beforeEach(() => {
    givenSupabaseReturns({ data: [], error: null });
  });

  /** @scenarios cuatro-carburantes-con-precio */
  test.fails('cuatro-carburantes-con-precio: devuelve mínimo, máximo y media de cada carburante', async () => {
    givenSupabaseReturns({
      data: [station(1.4, 1.55, 1.5, 1.65), station(1.3, 1.45, 1.6, 1.75), station(1.5, 1.65, 1.4, 1.85)],
      error: null,
    });

    const { status, body } = await requestStats('VIGO');

    expect(status).toBe(200);
    expect(body).toEqual({
      diesel: fuelStats(1.3, 1.5, 1.4),
      diesel_extra: fuelStats(1.45, 1.65, 1.55),
      gas95: fuelStats(1.4, 1.6, 1.5),
      gas98: fuelStats(1.65, 1.85, 1.75),
    });
  });

  /** @scenarios precios-sin-dato-se-ignoran */
  test.fails('precios-sin-dato-se-ignoran: los precios 0 no cuentan en mínimo, máximo ni media', async () => {
    givenSupabaseReturns({
      data: [station(1.4, 0, 1.5, 1.7), station(1.3, 1.45, 0, 0), station(0, 1.65, 1.6, 1.9)],
      error: null,
    });

    const { status, body } = await requestStats('VIGO');

    expect(status).toBe(200);
    expect(body).toEqual({
      diesel: fuelStats(1.3, 1.4, 1.35),
      diesel_extra: fuelStats(1.45, 1.65, 1.55),
      gas95: fuelStats(1.5, 1.6, 1.55),
      gas98: fuelStats(1.7, 1.9, 1.8),
    });
  });

  /** @scenarios carburante-sin-precios-se-omite */
  test.fails('carburante-sin-precios-se-omite: un carburante sin precios válidos no aparece', async () => {
    givenSupabaseReturns({
      data: [station(1.4, 1.55, 1.5, 0), station(1.3, 1.45, 1.6, 0)],
      error: null,
    });

    const { status, body } = await requestStats('VIGO');

    expect(status).toBe(200);
    expect(body).toEqual({
      diesel: fuelStats(1.3, 1.4, 1.35),
      diesel_extra: fuelStats(1.45, 1.55, 1.5),
      gas95: fuelStats(1.5, 1.6, 1.55),
    });
  });

  /** @scenarios localidad-sin-precios-validos */
  test.fails('localidad-sin-precios-validos: responde null si ninguna estación tiene precio válido', async () => {
    givenSupabaseReturns({ data: [station(0, 0, 0, 0), station(0, 0, 0, 0)], error: null });

    const { status, body } = await requestStats('VIGO');

    expect(status).toBe(200);
    expect(body).toBeNull();
  });

});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/stats — comportamiento que se conserva', () => {
  beforeEach(() => {
    givenSupabaseReturns({ data: [], error: null });
  });

  test('responde null si ninguna estación coincide', async () => {
    givenSupabaseReturns({ data: [], error: null });

    const { status, body } = await requestStats('LOCALIDAD INEXISTENTE');

    expect(status).toBe(200);
    expect(body).toBeNull();
  });

  test('responde 500 con el mensaje del error', async () => {
    givenSupabaseReturns({ data: null, error: { message: 'connection refused' } });

    const { status, body } = await requestStats('VIGO');

    expect(status).toBe(500);
    expect(body).toEqual({ error: 'connection refused' });
  });
});
