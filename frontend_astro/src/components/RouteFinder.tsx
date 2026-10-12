import React, { Suspense, lazy, useState } from 'react';
import { Navigation } from 'lucide-react';
import PlaceInput, { type Place } from './PlaceInput';
import StationCard from './StationCard';
import { PROVINCE_SORT_COLUMNS, provinceSortFuel } from '../lib/provinces';

const RouteMap = lazy(() => import('./RouteMap'));

const RADII_KM = [1, 2, 5, 10];
const DEFAULT_RADIUS_KM = 2;
const REQUEST_TIMEOUT_MS = 20_000;
const COORDINATE_DECIMALS = 6;
const FUEL_LABELS = { diesel: 'Gasóleo A', gas95: 'Gasolina 95' } as const;
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Elige un origen y un destino de la lista.',
  404: 'No hay ruta por carretera entre esos dos puntos.',
  502: 'El servicio de rutas no responde ahora mismo. Inténtalo en un rato.',
};

type RouteResult = {
  route: { distanceKm: number; durationMin: number; geometry: [number, number][] };
  stations: (Record<string, any> & { id_ss: number; kmRuta: number; desvioKm: number; masBarataDelTramo: boolean })[];
  radiusKm: number; // el pedido, no el que haya ahora en el selector
};

// Siempre en decimal: Photon puede dar 1e-7 y la API solo acepta decimales.
const formatLonLat = ({ lon, lat }: Place): string => `${lon.toFixed(COORDINATE_DECIMALS)},${lat.toFixed(COORDINATE_DECIMALS)}`;

interface RouteFinderProps {
  activeFilters: string[];
  pinnedIds: Set<number>;
  onTogglePin: (station: any) => void;
}

const formatDuration = (minutes: number): string => `${Math.floor(minutes / 60)} h ${minutes % 60} min`;

const RouteFinder: React.FC<RouteFinderProps> = ({ activeFilters, pinnedIds, onTogglePin }) => {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fuel = provinceSortFuel(activeFilters);
  const priceColumn = PROVINCE_SORT_COLUMNS[fuel];

  const calculate = async () => {
    if (!origin || !destination) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const params = new URLSearchParams({ from: formatLonLat(origin), to: formatLonLat(destination), radius: String(radiusKm), fuel });
      const response = await fetch(`/api/route-stations?${params}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) { setError(ERROR_MESSAGES[response.status] ?? 'No se ha podido calcular la ruta.'); return; }
      setResult({ ...(await response.json()), radiusKm });
    } catch {
      setError('No se ha podido calcular la ruta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label='Gasolineras en ruta'>
      <div className='bg-white astro-dark:bg-white/5 rounded-3xl p-5 desk:p-6 border border-gray-100 astro-dark:border-white/5 shadow-sm mb-6 grid gap-4 desk:grid-cols-2'>
        <PlaceInput label='Origen' value={origin} onChange={setOrigin} />
        <PlaceInput label='Destino' value={destination} onChange={setDestination} />
        <label className='block text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-gray-400'>
          Desvío máximo
          <select name='radius' value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className='mt-2 w-full border rounded-2xl px-4 py-3 font-bold normal-case tracking-normal text-sm outline-none focus:ring-2 focus:ring-primary bg-gray-50 astro-dark:bg-white/5 border-gray-100 astro-dark:border-white/10 text-secondary astro-dark:text-white'>
            {RADII_KM.map((km) => <option key={km} value={km}>{km} km de la carretera</option>)}
          </select>
        </label>
        <div className='flex flex-col justify-end'>
          <button type='button' onClick={calculate} disabled={!origin || !destination || loading} className='w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-2'>
            <Navigation aria-hidden='true' size={16} /> {loading ? 'Calculando...' : 'Calcular ruta'}
          </button>
          <p className='text-[10px] text-gray-400 mt-2 ml-1'>Precio de referencia: {FUEL_LABELS[fuel]} (según los filtros)</p>
        </div>
      </div>

      {error && <p role='alert' className='bg-white astro-dark:bg-white/5 rounded-3xl p-6 text-center text-secondary astro-dark:text-white font-bold border border-gray-100 astro-dark:border-white/5 mb-6'>{error}</p>}

      {result && (
        <>
          <div className='flex items-center justify-between mb-4 px-2'>
            <h2 className='font-black text-secondary astro-dark:text-white uppercase tracking-widest text-xs'>{result.route.distanceKm} km · {formatDuration(result.route.durationMin)}</h2>
            <span className='text-[10px] text-gray-400 font-bold'>{result.stations.length} GASOLINERAS</span>
          </div>
          <Suspense fallback={<div className='h-80 desk:h-96 w-full rounded-3xl bg-gray-100 astro-dark:bg-white/5 animate-pulse mb-6' />}>
            <RouteMap geometry={result.route.geometry} stations={result.stations.map((station) => ({ id_ss: station.id_ss, rotulo: station.rotulo, latitud: station.latitud, longitud: station.longitud, kmRuta: station.kmRuta, price: station[priceColumn], masBarataDelTramo: station.masBarataDelTramo }))} />
          </Suspense>
          {result.stations.length === 0 && <p className='py-10 text-center text-gray-400 text-sm'>No hay gasolineras con precio de {FUEL_LABELS[fuel]} a {result.radiusKm} km o menos de la ruta.</p>}
          <ol className='grid grid-cols-1 gap-2'>
            {result.stations.map((station, index) => (
              <li key={station.id_ss}>
                <p className='text-[10px] font-black uppercase tracking-widest ml-2 mb-1 text-gray-400'>
                  km {Math.round(station.kmRuta)} · a {station.desvioKm.toFixed(1)} km de la ruta
                  {station.masBarataDelTramo && <span className='ml-2 text-green-600'>Más barata del tramo</span>}
                </p>
                <StationCard station={station} activeFilters={activeFilters} stats={null} isPinned={pinnedIds.has(station.id_ss)} onTogglePin={onTogglePin} index={index} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
};

export default RouteFinder;
