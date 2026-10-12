export type RouteOrder = 'km' | 'precio';
export type RouteListStation = { kmRuta: number; desvioKm: number } & Record<string, unknown>;

export function sortRouteStations<T extends RouteListStation>(_stations: T[], _order: RouteOrder, _priceColumn: string): T[] {
  throw new Error('not implemented');
}

export function routePositionLabel(_station: { kmRuta: number; desvioKm: number }): string {
  throw new Error('not implemented');
}
