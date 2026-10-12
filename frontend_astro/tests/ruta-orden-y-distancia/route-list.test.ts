import { describe, expect, test } from 'vitest';
import { routePositionLabel, sortRouteStations } from '../../src/lib/route-list';

const station = (id: number, kmRuta: number, diesel: number, gas95: number) => ({
  id_ss: id,
  kmRuta,
  desvioKm: 0.3,
  precio_diesel: diesel,
  precio_gasolina_95: gas95,
});

const idsOf = (stations: { id_ss: number }[]): number[] => stations.map((s) => s.id_ss);

describe('lista de la ruta — orden y distancia', () => {
  /** @scenarios ruta-ordenada-por-precio */
  test.fails('ruta-ordenada-por-precio: de más barata a más cara del carburante elegido; a igual precio, por km; vuelve al orden del viaje', () => {
    const inTripOrder = [station(1, 10, 1.5, 1.6), station(2, 50, 1.4, 1.7), station(3, 120, 1.4, 1.5), station(4, 180, 1.6, 1.4)];

    const byDiesel = sortRouteStations(inTripOrder, 'precio', 'precio_diesel');
    const byGas95 = sortRouteStations(inTripOrder, 'precio', 'precio_gasolina_95');
    const backToTrip = sortRouteStations(byDiesel, 'km', 'precio_diesel');

    expect(idsOf(byDiesel)).toEqual([2, 3, 1, 4]);
    expect(idsOf(byGas95)).toEqual([4, 3, 1, 2]);
    expect(idsOf(backToTrip)).toEqual([1, 2, 3, 4]);
    expect(idsOf(inTripOrder)).toEqual([1, 2, 3, 4]);
  });

  /** @scenarios ruta-distancia-desde-origen */
  test.fails('ruta-distancia-desde-origen: «A N km del origen · a D km de la carretera»', () => {
    expect(routePositionLabel({ kmRuta: 95.12, desvioKm: 0.84 })).toBe('A 95 km del origen · a 0,8 km de la carretera');
    expect(routePositionLabel({ kmRuta: 0.4, desvioKm: 1.96 })).toBe('A 0 km del origen · a 2,0 km de la carretera');
    expect(routePositionLabel({ kmRuta: 1199.6, desvioKm: 10 })).toBe('A 1200 km del origen · a 10,0 km de la carretera');
  });
});
