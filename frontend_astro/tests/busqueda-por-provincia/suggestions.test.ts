import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase } from '../support/fake-supabase';

vi.mock('../../src/lib/supabase', async () => ({ supabase: (await import('../support/fake-supabase')).fakeSupabase }));

import { GET } from '../../src/pages/api/suggestions';

type GetContext = Parameters<typeof GET>[0];

const stationIn = (localidad: string, provincia: string) => ({ localidad, provincia });

const requestSuggestions = async (text: string): Promise<{ status: number; body: unknown }> => {
  const context = { url: new URL(`http://localhost/api/suggestions?q=${encodeURIComponent(text)}`) };
  const response = await GET(context as unknown as GetContext);
  return { status: response.status, body: await response.json() };
};

beforeEach(() => {
  fakeDatabase.reset();
  fakeDatabase.seed('servicestations', [
    stationIn('PONTEAREAS', 'PONTEVEDRA'),
    stationIn('PONTEVEDRA', 'PONTEVEDRA'),
    stationIn('VIGO', 'PONTEVEDRA'),
    stationIn('MALAGÓN', 'CIUDAD REAL'),
    stationIn('CORUÑA (A)', 'CORUÑA (A)'),
  ]);
});

describe('GET /api/suggestions — sugerencias de localidades y provincias', () => {
  /** @scenarios sugerencias-incluyen-provincia */
  test('sugerencias-incluyen-provincia: devuelve las localidades y la provincia que coinciden, con su tipo', async () => {
    const { status, body } = await requestSuggestions('ponte');

    expect(status).toBe(200);
    expect(body).toEqual(
      expect.arrayContaining([
        { tipo: 'provincia', nombre: 'PONTEVEDRA' },
        { tipo: 'localidad', nombre: 'PONTEAREAS' },
        { tipo: 'localidad', nombre: 'PONTEVEDRA' },
      ]),
    );
    expect(body).toHaveLength(3);
  });

  /** @scenarios sugerencias-incluyen-provincia */
  test('sugerencias-incluyen-provincia: un nombre con paréntesis («coruña (a)») sugiere la provincia y la localidad', async () => {
    const { status, body } = await requestSuggestions('coruña (a)');

    expect(status).toBe(200);
    expect(body).toEqual([
      { tipo: 'provincia', nombre: 'CORUÑA (A)' },
      { tipo: 'localidad', nombre: 'CORUÑA (A)' },
    ]);
  });

  /** @scenarios sugerencia-provincia-sin-tildes-ni-articulo */
  test('sugerencia-provincia-sin-tildes-ni-articulo: encuentra MÁLAGA, CORUÑA (A) y PALMAS (LAS)', async () => {
    const malaga = await requestSuggestions('malaga');
    const coruna = await requestSuggestions('a coruna');
    const palmas = await requestSuggestions('las palmas');

    expect(malaga.body).toContainEqual({ tipo: 'provincia', nombre: 'MÁLAGA' });
    expect(coruna.body).toContainEqual({ tipo: 'provincia', nombre: 'CORUÑA (A)' });
    expect(palmas.body).toContainEqual({ tipo: 'provincia', nombre: 'PALMAS (LAS)' });
  });
});

// Hallazgo de seguridad cerrado en la verificación (S2): el texto del usuario va entre comillas en el filtro.
describe('GET /api/suggestions — el texto es un literal', () => {
  test('el texto no puede añadir condiciones al filtro de localidades', async () => {
    const { status, body } = await requestSuggestions('zzqq,provincia.ilike.PONTEVEDRA');

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/suggestions — comportamiento que se conserva', () => {
  test('con menos de 2 caracteres no sugiere nada', async () => {
    const { status, body } = await requestSuggestions('p');

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  test('un texto de solo espacios no sugiere nada', async () => {
    const { status, body } = await requestSuggestions('   ');

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});
