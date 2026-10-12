export type ProvinceSortFuel = 'diesel' | 'gas95';

export const PROVINCE_SORT_COLUMNS = { diesel: 'precio_diesel', gas95: 'precio_gasolina_95' } as const;

// Grafía exacta de la columna servicestations.provincia (la del Ministerio).
export const PROVINCES = [
  'ALBACETE', 'ALICANTE', 'ALMERÍA', 'ARABA/ÁLAVA', 'ASTURIAS', 'ÁVILA', 'BADAJOZ', 'BALEARS (ILLES)', 'BARCELONA',
  'BIZKAIA', 'BURGOS', 'CÁCERES', 'CÁDIZ', 'CANTABRIA', 'CASTELLÓN / CASTELLÓ', 'CEUTA', 'CIUDAD REAL', 'CÓRDOBA',
  'CORUÑA (A)', 'CUENCA', 'GIPUZKOA', 'GIRONA', 'GRANADA', 'GUADALAJARA', 'HUELVA', 'HUESCA', 'JAÉN', 'LEÓN', 'LLEIDA',
  'LUGO', 'MADRID', 'MÁLAGA', 'MELILLA', 'MURCIA', 'NAVARRA', 'OURENSE', 'PALENCIA', 'PALMAS (LAS)', 'PONTEVEDRA',
  'RIOJA (LA)', 'SALAMANCA', 'SANTA CRUZ DE TENERIFE', 'SEGOVIA', 'SEVILLA', 'SORIA', 'TARRAGONA', 'TERUEL', 'TOLEDO',
  'VALENCIA / VALÈNCIA', 'VALLADOLID', 'ZAMORA', 'ZARAGOZA',
] as const;

const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().trim();

// «CORUÑA (A)» también se escribe «A CORUÑA».
const withLeadingArticle = (province: string): string => province.replace(/^(.+) \((.+)\)$/, '$2 $1');

const searchableNames = (province: string): string[] => [normalize(province), normalize(withLeadingArticle(province))];

export function matchProvinces(text: string): string[] {
  const query = normalize(text);
  return PROVINCES.filter((province) => searchableNames(province).some((name) => name.includes(query)));
}

export function provinceSortFuel(activeFilters: string[]): ProvinceSortFuel {
  return activeFilters.includes('diesel') ? 'diesel' : 'gas95';
}
