import { describe, expect, test } from 'vitest';
import { googleMapsUrl } from '../../src/lib/maps';

const station = (latitud: unknown, longitud: unknown) => ({
  latitud,
  longitud,
  direccion: 'AVENIDA DE MADRID, 1',
  localidad: 'VIGO',
  provincia: 'PONTEVEDRA',
});

const queryOf = (url: string): string => {
  const parsed = new URL(url);
  expect(`${parsed.origin}${parsed.pathname}`).toBe('https://www.google.com/maps/search/');
  expect(parsed.searchParams.get('api')).toBe('1');
  return parsed.searchParams.get('query') ?? '';
};

describe('enlace de la dirección a Google Maps', () => {
  /** @scenarios direccion-abre-google-maps */
  test.fails('direccion-abre-google-maps: con coordenadas en España, el enlace va a la latitud y longitud', () => {
    expect(queryOf(googleMapsUrl(station(42.214083, -8.700889)))).toBe('42.214083,-8.700889');
    expect(queryOf(googleMapsUrl(station(28.4636, -16.2546)))).toBe('28.4636,-16.2546');
  });

  /** @scenarios direccion-sin-coordenadas-busca-por-direccion */
  test.fails('direccion-sin-coordenadas-busca-por-direccion: sin coordenadas válidas, busca dirección, localidad y provincia', () => {
    const byAddress = 'AVENIDA DE MADRID, 1, VIGO, PONTEVEDRA';
    expect(queryOf(googleMapsUrl(station(null, null)))).toBe(byAddress);
    expect(queryOf(googleMapsUrl(station(0, 0)))).toBe(byAddress);
    expect(queryOf(googleMapsUrl(station(-8.659472, 42.037472)))).toBe(byAddress);
    expect(queryOf(googleMapsUrl(station('42.21', '-8.70')))).toBe(byAddress);
  });
});
