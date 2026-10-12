// Supabase falso para los tests de los endpoints: aplica los filtros de la consulta sobre filas sembradas
// por tabla, como haría PostgREST. Solo cubre los operadores que usa la app.

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;
type Order = { column: string; ascending: boolean };
type QueryError = { message: string };
type QueryResult = { data: Row[] | null; error: QueryError | null; count: number | null };

const tables = new Map<string, Row[]>();
let failure: QueryError | null = null;

export const fakeDatabase = {
  seed(table: string, rows: Row[]): void {
    tables.set(table, rows);
  },
  failWith(message: string): void {
    failure = { message };
  },
  reset(): void {
    tables.clear();
    failure = null;
  },
};

const compare = (a: unknown, b: unknown): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

const likeToRegExp = (pattern: string): RegExp => {
  const unescaped = pattern.replace(/\\([()])/g, '$1');
  const source = unescaped
    .split('%')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`, 'i');
};

const ilike = (column: string, pattern: string): Predicate => {
  const regExp = likeToRegExp(pattern);
  return (row) => regExp.test(String(row[column] ?? ''));
};

// Solo condiciones `columna.ilike.patrón` separadas por comas (las comas escapadas no se usan en la app).
const orFilter = (conditions: string): Predicate => {
  const predicates = conditions.split(',').map((condition) => {
    const [column, operator, ...rest] = condition.split('.');
    if (operator !== 'ilike') throw new Error(`fake-supabase: or() no soporta ${operator}`);
    return ilike(column, rest.join('.'));
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
    gt: (column: string, value: unknown) => where((row) => compare(row[column], value) > 0),
    gte: (column: string, value: unknown) => where((row) => compare(row[column], value) >= 0),
    lte: (column: string, value: unknown) => where((row) => compare(row[column], value) <= 0),
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
  from: (table: string) =>
    query({ table, columns: null, countRequested: false, head: false, predicates: [], orders: [], window: null }),
};
