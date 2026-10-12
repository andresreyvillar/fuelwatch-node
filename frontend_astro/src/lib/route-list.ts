// Lista de gasolineras de la pestaña Ruta: orden y etiqueta de distancia. Sin Supabase: la usa la UI.

export type RouteOrder = 'km' | 'precio';
export type RouteListStation = { kmRuta: number; desvioKm: number } & Record<string, unknown>;

const byKm = (a: RouteListStation, b: RouteListStation): number => a.kmRuta - b.kmRuta;

// Copia ordenada: por km de ruta (orden del viaje) o por precio del carburante, desempatando por km.
export function sortRouteStations<T extends RouteListStation>(stations: T[], order: RouteOrder, priceColumn: string): T[] {
  const price = (station: T): number => Number(station[priceColumn]);
  const compare = order === 'precio' ? (a: T, b: T) => price(a) - price(b) || byKm(a, b) : byKm;
  return [...stations].sort(compare);
}

const formatKm = (km: number, decimals: number): string => km.toFixed(decimals).replace('.', ',');

// «A 95 km del origen · a 0,8 km de la carretera»: km por la ruta desde el origen y desvío en línea recta.
export function routePositionLabel({ kmRuta, desvioKm }: { kmRuta: number; desvioKm: number }): string {
  return `A ${Math.round(kmRuta)} km del origen · a ${formatKm(desvioKm, 1)} km de la carretera`;
}
