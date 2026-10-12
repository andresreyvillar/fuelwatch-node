import { isInSpain } from './route';

export type MappableStation = { latitud: unknown; longitud: unknown; direccion?: string; localidad?: string; provincia?: string };

// URL universal de Google Maps: pestaña nueva en escritorio, app de Google Maps en el móvil si está instalada.
const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=';

// Coordenadas si son números dentro de España (descarta vacías, 0,0 e invertidas); si no, dirección, localidad y provincia.
export function googleMapsUrl({ latitud, longitud, direccion, localidad, provincia }: MappableStation): string {
  const hasValidCoordinates = typeof latitud === 'number' && typeof longitud === 'number' && isInSpain([longitud, latitud]);
  const query = hasValidCoordinates
    ? `${latitud},${longitud}`
    : [direccion, localidad, provincia].filter(Boolean).join(', ');
  return `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(query)}`;
}
