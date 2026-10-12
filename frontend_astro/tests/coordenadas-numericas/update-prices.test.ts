import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

import { GET } from '../../src/pages/api/update-prices';

type GetContext = Parameters<typeof GET>[0];
type MinistryStation = Record<string, string>;

const ministryStation = (id: string, latitud: string, longitud: string): MinistryStation => ({
  IDEESS: id,
  'Rótulo': 'REPSOL',
  Horario: 'L-D: 24H',
  'Precio Gasoleo A': '1,469',
  'Precio Gasoleo Premium': '',
  'Precio Gasolina 95 E5': '1,559',
  'Precio Gasolina 98 E5': '',
  'Dirección': 'AVENIDA DE MADRID, 1',
  Provincia: 'PONTEVEDRA',
  Localidad: 'VIGO',
  'C.P.': '36204',
  Latitud: latitud,
  'Longitud (WGS84)': longitud,
});

const givenMinistryPublishes = (stations: MinistryStation[]): void => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ Fecha: '12/10/2026 9:00:00', ListaEESSPrecio: stations }))));
};

const runSync = async (): Promise<number> => {
  const response = await GET({} as unknown as GetContext);
  return response.status;
};

const storedStation = (id: number) => fakeDatabase.upserted('servicestations').find((row) => row.id_ss === id);

beforeEach(() => {
  fakeDatabase.reset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/update-prices — coordenadas numéricas', () => {
  /** @scenarios coordenadas-guardadas-como-numero */
  test('coordenadas-guardadas-como-numero: guarda latitud y longitud como números', async () => {
    givenMinistryPublishes([ministryStation('362', '42,240611', '-8,720278')]);

    expect(await runSync()).toBe(200);
    expect(storedStation(362)).toMatchObject({ latitud: 42.240611, longitud: -8.720278 });
  });

  /** @scenarios coordenada-sin-dato-es-null */
  test('coordenada-sin-dato-es-null: una coordenada vacía o no numérica se guarda como null', async () => {
    givenMinistryPublishes([ministryStation('1', '', '-8,720278'), ministryStation('2', '42,240611', 'sin dato')]);

    expect(await runSync()).toBe(200);
    expect(storedStation(1)).toMatchObject({ id_ss: 1, latitud: null, longitud: -8.720278, localidad: 'VIGO' });
    expect(storedStation(2)).toMatchObject({ id_ss: 2, latitud: 42.240611, longitud: null, localidad: 'VIGO' });
  });

  /** @scenarios coordenada-sin-dato-es-null */
  test('coordenada-sin-dato-es-null: solo espacios o formatos que no son decimales también son null', async () => {
    givenMinistryPublishes([ministryStation('1', ' ', '\t'), ministryStation('2', '0x10', '1e3')]);

    expect(await runSync()).toBe(200);
    expect(storedStation(1)).toMatchObject({ latitud: null, longitud: null });
    expect(storedStation(2)).toMatchObject({ latitud: null, longitud: null });
  });
});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/update-prices — comportamiento que se conserva', () => {
  test('parsea los precios y guarda el día en el histórico', async () => {
    givenMinistryPublishes([ministryStation('362', '42,240611', '-8,720278')]);

    expect(await runSync()).toBe(200);
    expect(storedStation(362)).toMatchObject({ precio_diesel: 1.469, precio_gasolina_95: 1.559, precio_diesel_extra: 0 });
    expect(fakeDatabase.upserted('price_history')).toEqual([
      expect.objectContaining({ station_id: 362, diesel: 1.469, gas95: 1.559, diesel_extra: null, gas98: null }),
    ]);
  });
});
