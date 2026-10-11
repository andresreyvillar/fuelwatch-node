import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type DailyPrices = {
  station_id: number;
  fecha: string;
  diesel: number | null;
  gas95: number | null;
  diesel_extra: number | null;
  gas98: number | null;
};

// price_history falso: aplica los filtros de la consulta sobre las filas sembradas y proyecta las columnas
// del select al final, como hace PostgREST (se puede filtrar por una columna que no se selecciona).
const priceHistory = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  type Step = (rows: Row[]) => Row[];
  const state = { rows: [] as Row[], error: null as { message: string } | null };

  const project = (rows: Row[], columns: string[] | null): Row[] =>
    columns ? rows.map((row) => Object.fromEntries(columns.map((name) => [name, row[name]]))) : rows;

  const query = (steps: Step[], columns: string[] | null) => {
    const next = (step: Step) => query([...steps, step], columns);
    const run = () =>
      state.error
        ? { data: null, error: state.error }
        : { data: project(steps.reduce((rows, step) => step(rows), state.rows), columns), error: null };
    return {
      select: (list: string) => query(steps, list.split(',').map((name) => name.trim())),
      eq: (column: string, value: unknown) => next((rows) => rows.filter((row) => row[column] === value)),
      gte: (column: string, value: string) => next((rows) => rows.filter((row) => String(row[column]) >= value)),
      lte: (column: string, value: string) => next((rows) => rows.filter((row) => String(row[column]) <= value)),
      order: (column: string, options: { ascending: boolean }) =>
        next((rows) =>
          [...rows].sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (options.ascending ? 1 : -1)),
        ),
      limit: (count: number) => next((rows) => rows.slice(0, count)),
      then: (resolve: (result: { data: Row[] | null; error: { message: string } | null }) => unknown) => resolve(run()),
    };
  };

  return { state, query };
});

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: () => priceHistory.query([], null) },
}));

import { GET } from '../../src/pages/api/history';

type GetContext = Parameters<typeof GET>[0];

const TODAY = '2026-10-11';
const STATION_ID = 362;
const OTHER_STATION_ID = 9999;

const daysAgo = (days: number): string => {
  const date = new Date(`${TODAY}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split('T')[0];
};

const dailyPrices = (stationId: number, days: number): DailyPrices => ({
  station_id: stationId,
  fecha: daysAgo(days),
  diesel: 1.4 + days / 1000,
  gas95: 1.5 + days / 1000,
  diesel_extra: days % 2 === 0 ? 1.55 + days / 1000 : null,
  gas98: 1.7 + days / 1000,
});

const asResponseItem = ({ station_id: _stationId, ...prices }: DailyPrices) => prices;

const givenPriceHistory = (rows: DailyPrices[]): void => {
  priceHistory.state.rows = rows;
  priceHistory.state.error = null;
};

const givenPriceHistoryFails = (message: string): void => {
  priceHistory.state.rows = [];
  priceHistory.state.error = { message };
};

const requestHistory = async (id: string | null): Promise<{ status: number; body: unknown }> => {
  const query = id === null ? '' : `?id=${id}`;
  const context = { url: new URL(`http://localhost/api/history${query}`) };
  const response = await GET(context as unknown as GetContext);
  return { status: response.status, body: await response.json() };
};

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  givenPriceHistory([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /api/history — histórico de los últimos 30 días', () => {
  /** @scenarios historico-ultimos-30-dias */
  test.fails('historico-ultimos-30-dias: devuelve los días entre hoy − 29 y hoy, en orden ascendente', async () => {
    const sixtyDays = range(0, 59).map((days) => dailyPrices(STATION_ID, days));
    const otherStation = range(0, 5).map((days) => dailyPrices(OTHER_STATION_ID, days));
    givenPriceHistory([...sixtyDays, ...otherStation]);

    const { status, body } = await requestHistory(String(STATION_ID));

    expect(status).toBe(200);
    const lastThirtyDaysAscending = range(0, 29)
      .reverse()
      .map((days) => asResponseItem(dailyPrices(STATION_ID, days)));
    expect(body).toEqual(lastThirtyDaysAscending);
  });

  /** @scenarios historico-con-huecos-no-se-rellena */
  test.fails('historico-con-huecos-no-se-rellena: solo los días existentes de la ventana, sin días más antiguos', async () => {
    givenPriceHistory([45, 40, 30, 29, 20, 3].map((days) => dailyPrices(STATION_ID, days)));

    const { status, body } = await requestHistory(String(STATION_ID));

    expect(status).toBe(200);
    expect(body).toEqual([29, 20, 3].map((days) => asResponseItem(dailyPrices(STATION_ID, days))));
  });

  /** @scenarios historico-sin-datos-recientes */
  test.fails('historico-sin-datos-recientes: responde una lista vacía si todos los días son anteriores a hoy − 29', async () => {
    givenPriceHistory(range(30, 40).map((days) => dailyPrices(STATION_ID, days)));

    const { status, body } = await requestHistory(String(STATION_ID));

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });
});

// Comportamiento que el slice conserva (ya se cumplía antes): regresión, fuera del semáforo.
describe('GET /api/history — comportamiento que se conserva', () => {
  test('devuelve todos los días de una estación con menos de 30 días de histórico', async () => {
    givenPriceHistory(range(0, 9).map((days) => dailyPrices(STATION_ID, days)));

    const { status, body } = await requestHistory(String(STATION_ID));

    expect(status).toBe(200);
    expect(body).toEqual(range(0, 9).reverse().map((days) => asResponseItem(dailyPrices(STATION_ID, days))));
  });

  test('responde 400 si falta el id', async () => {
    const { status, body } = await requestHistory(null);

    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Missing id' });
  });

  test('responde 500 con el mensaje del error', async () => {
    givenPriceHistoryFails('connection refused');

    const { status, body } = await requestHistory(String(STATION_ID));

    expect(status).toBe(500);
    expect(body).toEqual({ error: 'connection refused' });
  });
});

