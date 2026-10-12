import { describe, expect, test } from 'vitest';

type MinistryStation = Record<string, string>;
type SyncScript = { toStation: (eess: MinistryStation) => Record<string, unknown> };

// El script se importa sin credenciales: solo se ejecuta la sincronización al lanzarlo con node.
const loadSyncScript = async (): Promise<SyncScript> =>
  (await import('../../../scripts/sync-prices.mjs')) as unknown as SyncScript;

const ministryStation = (latitud: string, longitud: string): MinistryStation => ({
  IDEESS: '362',
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

describe('scripts/sync-prices.mjs — coordenadas numéricas', () => {
  /** @scenarios coordenadas-guardadas-como-numero */
  test.fails('coordenadas-guardadas-como-numero: la estación lleva latitud y longitud como números', async () => {
    const { toStation } = await loadSyncScript();

    expect(toStation(ministryStation('42,240611', '-8,720278'))).toMatchObject({ latitud: 42.240611, longitud: -8.720278 });
  });

  /** @scenarios coordenada-sin-dato-es-null */
  test.fails('coordenada-sin-dato-es-null: una coordenada vacía o no numérica es null', async () => {
    const { toStation } = await loadSyncScript();

    expect(toStation(ministryStation('', '-8,720278'))).toMatchObject({ latitud: null, longitud: -8.720278, localidad: 'VIGO' });
    expect(toStation(ministryStation('42,240611', 'sin dato'))).toMatchObject({ latitud: 42.240611, longitud: null, localidad: 'VIGO' });
  });
});
