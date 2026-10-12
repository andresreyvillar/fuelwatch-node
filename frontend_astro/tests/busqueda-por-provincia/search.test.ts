import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

import { GET } from '../../src/pages/api/search';

type GetContext = Parameters<typeof GET>[0];
type SearchBody = { data: { id_ss: number }[]; meta: { total: number; page: number; lastPage: number } };

const station = (id: number, provincia: string, diesel: number, gas95: number, localidad = 'LOCALIDAD') => ({
  id_ss: id,
  rotulo: `ESTACION ${id}`,
  provincia,
  localidad,
  cp: '36000',
  precio_diesel: diesel,
  precio_diesel_extra: 0,
  precio_gasolina_95: gas95,
  precio_gasolina_98: 0,
});

const requestSearch = async (params: Record<string, string>): Promise<{ status: number; body: unknown }> => {
  const url = new URL('http://localhost/api/search');
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value));
  const response = await GET({ url } as unknown as GetContext);
  return { status: response.status, body: await response.json() };
};

const idsOf = (body: unknown): number[] => (body as SearchBody).data.map((item) => item.id_ss);
const metaOf = (body: unknown): SearchBody['meta'] => (body as SearchBody).meta;

beforeEach(() => {
  fakeDatabase.reset();
  fakeDatabase.seed('price_history', []);
  fakeDatabase.seed('servicestations', [
    station(1, 'PONTEVEDRA', 1.45, 1.6),
    station(2, 'PONTEVEDRA', 1.39, 1.65),
    station(3, 'PONTEVEDRA', 1.52, 1.55),
    station(4, 'PONTEVEDRA', 1.39, 0),
    station(5, 'PONTEVEDRA', 0, 1.5),
    station(6, 'OURENSE', 1.2, 1.3),
    station(7, 'PONTEVEDRA', 1.41, 1.58),
  ]);
});

describe('GET /api/search?province= — búsqueda por provincia ordenada por precio', () => {
  /** @scenarios provincia-ordenada-por-precio */
  test.fails('provincia-ordenada-por-precio: solo la provincia, por Gasóleo A ascendente, id a igual precio, paginada', async () => {
    const firstPage = await requestSearch({ province: 'PONTEVEDRA', fuel: 'diesel', page: '1', limit: '3' });
    const secondPage = await requestSearch({ province: 'PONTEVEDRA', fuel: 'diesel', page: '2', limit: '3' });

    expect(firstPage.status).toBe(200);
    expect(idsOf(firstPage.body)).toEqual([2, 4, 7]);
    expect(metaOf(firstPage.body)).toEqual({ total: 5, page: 1, lastPage: 2 });
    expect(idsOf(secondPage.body)).toEqual([1, 3]);
    expect(metaOf(secondPage.body)).toEqual({ total: 5, page: 2, lastPage: 2 });
  });

  /** @scenarios provincia-ordenada-por-gasolina-95 */
  test.fails('provincia-ordenada-por-gasolina-95: ordena por precio de Gasolina 95', async () => {
    const { status, body } = await requestSearch({ province: 'PONTEVEDRA', fuel: 'gas95', page: '1', limit: '10' });

    expect(status).toBe(200);
    expect(idsOf(body)).toEqual([5, 3, 7, 1, 2]);
  });

  /** @scenarios provincia-excluye-sin-carburante */
  test.fails('provincia-excluye-sin-carburante: sin precio de ese carburante no aparece ni cuenta', async () => {
    const diesel = await requestSearch({ province: 'PONTEVEDRA', fuel: 'diesel', page: '1', limit: '10' });
    const gas95 = await requestSearch({ province: 'PONTEVEDRA', fuel: 'gas95', page: '1', limit: '10' });

    expect(idsOf(diesel.body)).not.toContain(5);
    expect(metaOf(diesel.body).total).toBe(5);
    expect(idsOf(gas95.body)).not.toContain(4);
    expect(metaOf(gas95.body).total).toBe(5);
  });

  /** @scenarios provincia-carburante-no-valido */
  test.fails('provincia-carburante-no-valido: responde 400 sin carburante o con uno no admitido', async () => {
    const withoutFuel = await requestSearch({ province: 'PONTEVEDRA' });
    const unknownFuel = await requestSearch({ province: 'PONTEVEDRA', fuel: 'precio_diesel' });

    expect(withoutFuel).toEqual({ status: 400, body: { error: 'Invalid fuel' } });
    expect(unknownFuel).toEqual({ status: 400, body: { error: 'Invalid fuel' } });
  });
});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/search — comportamiento que se conserva', () => {
  test('la búsqueda por localidad sigue filtrando por localidad', async () => {
    fakeDatabase.seed('servicestations', [
      station(10, 'PONTEVEDRA', 1.4, 1.5, 'VIGO'),
      station(11, 'PONTEVEDRA', 1.3, 1.6, 'REDONDELA'),
    ]);

    const { status, body } = await requestSearch({ target: 'VIGO', page: '1', limit: '50' });

    expect(status).toBe(200);
    expect(idsOf(body)).toEqual([10]);
    expect(metaOf(body).total).toBe(1);
  });
});
