// Supabase falso para los tests de los endpoints: aplica los filtros de la consulta sobre filas sembradas
// por tabla, como haría PostgREST. Solo cubre los operadores que usa la app.

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;
type Order = { column: string; ascending: boolean };
type QueryError = { message: string };
type QueryResult = { data: Row[] | null; error: QueryError | null; count: number | null };

const tables = new Map<string, Row[]>();
const upserts = new Map<string, Row[]>();
let failure: QueryError | null = null;

export const fakeDatabase = {
  seed(table: string, rows: Row[]): void {
    tables.set(table, rows);
  },
  failWith(message: string): void {
    failure = { message };
  },
  // Filas enviadas con upsert() a una tabla, en orden.
  upserted(table: string): Row[] {
    return upserts.get(table) ?? [];
  },
  reset(): void {
    tables.clear();
    upserts.clear();
    failure = null;
  },
};

// supabase-js envía las filas como JSON: se guarda lo que sobrevive a JSON.stringify (NaN → null).
const upsert = (table: string, rows: Row[]) => ({
  then: <T>(resolve: (result: { data: null; error: QueryError | null }) => T) => {
    if (failure) return resolve({ data: null, error: failure });
    upserts.set(table, [...(upserts.get(table) ?? []), ...(JSON.parse(JSON.stringify(rows)) as Row[])]);
    return resolve({ data: null, error: null });
  },
});

const compare = (a: unknown, b: unknown): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

const likeToRegExp = (pattern: string): RegExp => {
  const source = pattern
    .split('%')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`, 'i');
};

const ilike = (column: string, pattern: string): Predicate => {
  const regExp = likeToRegExp(pattern);
  return (row) => regExp.test(String(row[column] ?? ''));
};

// Divide `a,b,"c,d"` por las comas que no están entre comillas.
const splitConditions = (conditions: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < conditions.length; i++) {
    const char = conditions[i];
    if (quoted && char === '\\') { current += char + conditions[++i]; continue; }
    if (char === '"') quoted = !quoted;
    if (char === ',' && !quoted) { parts.push(current); current = ''; continue; }
    current += char;
  }
  return [...parts, current];
};

// Como PostgREST: un valor con caracteres reservados debe ir entre comillas dobles (con \" y \\ escapados);
// sin comillas, la consulta falla.
const parseOrValue = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replace(/\\(["\\])/g, '$1');
  if (/[(),"\\]/.test(value)) throw new Error(`failed to parse logic tree (${value})`);
  return value;
};

// Solo condiciones `columna.ilike.valor` separadas por comas.
const orFilter = (conditions: string): Predicate => {
  const predicates = splitConditions(conditions).map((condition) => {
    const [column, operator, ...rest] = condition.split('.');
    if (operator !== 'ilike') throw new Error(`fake-supabase: or() no soporta ${operator}`);
    return ilike(column, parseOrValue(rest.join('.')));
  });
  return (row) => predicates.some((predicate) => predicate(row));
};

type QueryState = {
  table: string;
  columns: string[] | null;
  countRequested: boolean;
  head: boolean;
  predicates: Predicate[];
  orders: Order[];
  window: { from: number; to: number } | null;
};

const project = (rows: Row[], columns: string[] | null): Row[] =>
  columns ? rows.map((row) => Object.fromEntries(columns.map((name) => [name, row[name]]))) : rows;

const sortRows = (rows: Row[], orders: Order[]): Row[] =>
  [...rows].sort((a, b) => {
    for (const { column, ascending } of orders) {
      const result = compare(a[column], b[column]);
      if (result !== 0) return ascending ? result : -result;
    }
    return 0;
  });

const execute = (state: QueryState): QueryResult => {
  if (failure) return { data: null, error: failure, count: null };
  const matching = (tables.get(state.table) ?? []).filter((row) => state.predicates.every((predicate) => predicate(row)));
  const sorted = sortRows(matching, state.orders);
  const paged = state.window ? sorted.slice(state.window.from, state.window.to + 1) : sorted;
  return {
    data: state.head ? null : project(paged, state.columns),
    error: null,
    count: state.countRequested ? matching.length : null,
  };
};

const query = (state: QueryState) => {
  const next = (change: Partial<QueryState>) => query({ ...state, ...change });
  const where = (predicate: Predicate) => next({ predicates: [...state.predicates, predicate] });
  return {
    select: (list = '*', options: { count?: 'exact'; head?: boolean } = {}) =>
      next({
        columns: list.trim() === '*' ? null : list.split(',').map((name) => name.trim()),
        countRequested: options.count === 'exact',
        head: options.head ?? false,
      }),
    eq: (column: string, value: unknown) => where((row) => row[column] === value),
    // Como en Postgres, una comparación con NULL nunca es cierta.
    gt: (column: string, value: unknown) => where((row) => row[column] != null && compare(row[column], value) > 0),
    gte: (column: string, value: unknown) => where((row) => row[column] != null && compare(row[column], value) >= 0),
    lte: (column: string, value: unknown) => where((row) => row[column] != null && compare(row[column], value) <= 0),
    in: (column: string, values: unknown[]) => where((row) => values.includes(row[column])),
    ilike: (column: string, pattern: string) => where(ilike(column, pattern)),
    or: (conditions: string) => where(orFilter(conditions)),
    order: (column: string, options: { ascending?: boolean } = {}) =>
      next({ orders: [...state.orders, { column, ascending: options.ascending ?? true }] }),
    range: (from: number, to: number) => next({ window: { from, to } }),
    limit: (count: number) => next({ window: { from: 0, to: count - 1 } }),
    then: <T>(resolve: (result: QueryResult) => T) => resolve(execute(state)),
  };
};

export const fakeSupabase = {
  from: (table: string) => ({
    ...query({ table, columns: null, countRequested: false, head: false, predicates: [], orders: [], window: null }),
    upsert: (rows: Row[], _options?: { onConflict?: string }) => upsert(table, rows),
  }),
};
