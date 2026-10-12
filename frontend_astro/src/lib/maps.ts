export type MappableStation = { latitud: unknown; longitud: unknown; direccion?: string; localidad?: string; provincia?: string };

export function googleMapsUrl(_station: MappableStation): string {
  throw new Error('not implemented');
}
