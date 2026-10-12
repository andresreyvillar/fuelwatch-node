import { describe, expect, test } from 'vitest';
import { provinceSortFuel } from '../../src/lib/provinces';

describe('carburante de orden de la búsqueda por provincia', () => {
  /** @scenarios orden-provincia-segun-filtros */
  test('orden-provincia-segun-filtros: Diésel → Gasóleo A, Gasolina → Gasolina 95, los dos → Gasóleo A', () => {
    expect(provinceSortFuel(['diesel'])).toBe('diesel');
    expect(provinceSortFuel(['gasolina'])).toBe('gas95');
    expect(provinceSortFuel(['diesel', 'gasolina'])).toBe('diesel');
    expect(provinceSortFuel(['gasolina', 'diesel'])).toBe('diesel');
  });
});
