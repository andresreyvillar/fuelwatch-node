// Geometría del corredor de una ruta. Puntos en [lon, lat] (GeoJSON); distancias en km.

export type LonLat = [number, number];
export type Box = { minLat: number; maxLat: number; minLon: number; maxLon: number };
export type RoutePosition = { kmRuta: number; desvioKm: number };

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE = (Math.PI * EARTH_RADIUS_KM) / 180;
export const SECTION_KM = 100;
const MIN_CHUNK_KM = 25;
const MAX_CHUNKS = 30;
const DRAWING_SPACING_KM = 0.5;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Polyline codificada con 6 decimales (formato de OSRM con geometries=polyline6: pares lat, lon) → [lon, lat].
export function decodePolyline6(encoded: string): LonLat[] {
  const points: LonLat[] = [];
  let index = 0, lat = 0, lon = 0;
  const nextDelta = (): number => {
    let result = 0, shift = 0, byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += nextDelta();
    lon += nextDelta();
    points.push([lon / 1e6, lat / 1e6]);
  }
  return points;
}

export function haversineKm([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Km desde el origen hasta cada punto de la línea.
export function cumulativeKm(line: LonLat[]): number[] {
  const km = [0];
  for (let i = 1; i < line.length; i++) km.push(km[i - 1] + haversineKm(line[i - 1], line[i]));
  return km;
}

// Índices [desde, hasta] de cada tramo de consulta: tramos de max(25 km, longitud / 30).
export function chunkRanges(cumKm: number[]): [number, number][] {
  const totalKm = cumKm[cumKm.length - 1];
  const chunkKm = Math.max(MIN_CHUNK_KM, totalKm / MAX_CHUNKS);
  const ranges: [number, number][] = [];
  let start = 0;
  for (let i = 1; i < cumKm.length; i++) {
    const isLast = i === cumKm.length - 1;
    if (isLast || cumKm[i] - cumKm[start] >= chunkKm) {
      ranges.push([start, i]);
      start = i;
    }
  }
  return ranges.length > 0 ? ranges : [[0, 0]];
}

// Caja que envuelve los puntos del tramo, ampliada en radiusKm por cada lado.
export function boxAround(points: LonLat[], radiusKm: number): Box {
  const lats = points.map(([, lat]) => lat);
  const lons = points.map(([lon]) => lon);
  const maxAbsLat = Math.max(...lats.map(Math.abs));
  const latMargin = radiusKm / KM_PER_DEGREE;
  const lonMargin = radiusKm / (KM_PER_DEGREE * Math.cos(toRadians(maxAbsLat)));
  return {
    minLat: Math.min(...lats) - latMargin,
    maxLat: Math.max(...lats) + latMargin,
    minLon: Math.min(...lons) - lonMargin,
    maxLon: Math.max(...lons) + lonMargin,
  };
}

// Puntos from..to de la línea proyectados una sola vez (equirectangular, en km) alrededor del centro del tramo:
// medir muchas estaciones contra el mismo tramo no vuelve a proyectar ni a crear objetos.
export type ProjectedSpan = { from: number; refLon: number; refLat: number; kmPerDegreeLon: number; xs: Float64Array; ys: Float64Array };

export function projectSpan(line: LonLat[], from: number, to: number): ProjectedSpan {
  const [refLon, refLat] = line[Math.floor((from + to) / 2)];
  const kmPerDegreeLon = KM_PER_DEGREE * Math.cos(toRadians(refLat));
  const count = to - from + 1;
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    xs[k] = (line[from + k][0] - refLon) * kmPerDegreeLon;
    ys[k] = (line[from + k][1] - refLat) * KM_PER_DEGREE;
  }
  return { from, refLon, refLat, kmPerDegreeLon, xs, ys };
}

// Distancia del punto a la línea del tramo proyectado y km de ruta del punto más cercano.
export function locateInSpan([lon, lat]: LonLat, span: ProjectedSpan, cumKm: number[]): RoutePosition {
  const px = (lon - span.refLon) * span.kmPerDegreeLon;
  const py = (lat - span.refLat) * KM_PER_DEGREE;
  const { xs, ys } = span;
  let bestDistance = Infinity;
  let bestKm = cumKm[span.from];
  for (let k = 0; k + 1 < xs.length; k++) {
    const ax = xs[k] - px, ay = ys[k] - py, bx = xs[k + 1] - px, by = ys[k + 1] - py;
    // Descarte rápido: si los dos extremos están del mismo lado y más lejos que el mejor, el segmento no mejora.
    if ((ax > bestDistance && bx > bestDistance) || (ax < -bestDistance && bx < -bestDistance)) continue;
    if ((ay > bestDistance && by > bestDistance) || (ay < -bestDistance && by < -bestDistance)) continue;
    const dx = bx - ax, dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / lengthSquared));
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    if (distance < bestDistance) {
      const i = span.from + k;
      bestDistance = distance;
      bestKm = cumKm[i] + t * (cumKm[i + 1] - cumKm[i]);
    }
  }
  return { kmRuta: bestKm, desvioKm: bestDistance };
}

// Línea para dibujar: un punto cada 0,5 km como mínimo, siempre con el primero y el último.
export function simplifyForDrawing(line: LonLat[], cumKm: number[]): LonLat[] {
  const round = ([lon, lat]: LonLat): LonLat => [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
  const kept: LonLat[] = [round(line[0])];
  let lastKm = 0;
  for (let i = 1; i < line.length - 1; i++) {
    if (cumKm[i] - lastKm >= DRAWING_SPACING_KM) {
      kept.push(round(line[i]));
      lastKm = cumKm[i];
    }
  }
  if (line.length > 1) kept.push(round(line[line.length - 1]));
  return kept;
}

// true para la estación con el precio más bajo de cada tramo de 100 km de ruta (a igualdad, la primera).
export function cheapestPerSection(stations: { kmRuta: number; price: number }[]): boolean[] {
  const cheapestIndexBySection = new Map<number, number>();
  stations.forEach(({ kmRuta, price }, index) => {
    const section = Math.floor(kmRuta / SECTION_KM);
    const current = cheapestIndexBySection.get(section);
    if (current === undefined || price < stations[current].price) cheapestIndexBySection.set(section, index);
  });
  const winners = new Set(cheapestIndexBySection.values());
  return stations.map((_, index) => winners.has(index));
}
