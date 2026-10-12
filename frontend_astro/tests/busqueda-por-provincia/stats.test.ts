import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

import { GET } from '../../src/pages/api/stats';

type GetContext = Parameters<typeof GET>[0];

const station = (provincia: string, localidad: string, diesel: number, gas95: number) => ({
  provincia,
  localidad,
  cp: '36000',
  precio_diesel: diesel,
  precio_diesel_extra: 0,
  precio_gasolina_95: gas95,
  precio_gasolina_98: 0,
});

const requestStats = async (params: Record<string, string>): Promise<{ status: number; body: unknown }> => {
  const url = new URL('http://localhost/api/stats');
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value));
  const response = await GET({ url } as unknown as GetContext);
  return { status: response.status, body: await response.json() };
};

const fuelStats = (min: number, max: number, avg: number) => ({ min, max, avg: expect.closeTo(avg, 6) });

beforeEach(() => {
  fakeDatabase.reset();
  fakeDatabase.seed('servicestations', [
    station('PONTEVEDRA', 'VIGO', 1.4, 1.5),
    station('PONTEVEDRA', 'LALÍN', 1.3, 1.6),
    station('PONTEVEDRA', 'CANGAS', 1.5, 0),
    // Localidad cuyo nombre coincide con la provincia pero está en otra: no cuenta.
    station('CORUÑA (A)', 'PONTEVEDRA DE ABAIXO', 1.1, 1.2),
  ]);
});

describe('GET /api/stats?province= — estadística de zona de una provincia', () => {
  /** @scenarios estadistica-de-provincia */
  test('estadistica-de-provincia: usa todas las estaciones de la provincia y solo ellas', async () => {
    const { status, body } = await requestStats({ province: 'PONTEVEDRA' });

    expect(status).toBe(200);
    expect(body).toEqual({
      diesel: fuelStats(1.3, 1.5, 1.4),
      gas95: fuelStats(1.5, 1.6, 1.55),
    });
  });
});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/stats — comportamiento que se conserva', () => {
  test('la estadística por localidad sigue buscando por localidad', async () => {
    const { status, body } = await requestStats({ location: 'VIGO' });

    expect(status).toBe(200);
    expect(body).toEqual({ diesel: fuelStats(1.4, 1.4, 1.4), gas95: fuelStats(1.5, 1.5, 1.5) });
  });
});
