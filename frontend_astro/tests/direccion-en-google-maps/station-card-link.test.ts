import { describe, expect, test } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StationCard from '../../src/components/StationCard';

const station = {
  id_ss: 362,
  rotulo: 'ALCAMPO',
  direccion: 'AVENIDA DE MADRID, 1',
  localidad: 'VIGO',
  provincia: 'PONTEVEDRA',
  horario: 'L-D: 24H',
  latitud: 42.214083,
  longitud: -8.700889,
  precio_diesel: 1.469,
  precio_diesel_extra: 0,
  precio_gasolina_95: 1.559,
  precio_gasolina_98: 0,
  trend: null,
};

describe('StationCard — enlace de la dirección', () => {
  /** @scenarios direccion-abre-google-maps */
  test('direccion-abre-google-maps: la dirección es un enlace a Google Maps que se abre en una pestaña nueva', () => {
    const html = renderToStaticMarkup(React.createElement(StationCard, { station, activeFilters: ['diesel'], stats: null }));
    const anchor = html.match(/<a [^>]*href="https:\/\/www\.google\.com\/maps\/search\/[^"]*"[^>]*>/)?.[0] ?? '';

    expect(anchor).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=42.214083%2C-8.700889"');
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noopener noreferrer"');
    expect(anchor).toContain('aria-label="Abrir AVENIDA DE MADRID, 1 en Google Maps"');
  });
});
