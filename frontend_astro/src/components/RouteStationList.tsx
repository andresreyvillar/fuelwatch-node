import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import StationCard from './StationCard';
import { routePositionLabel, sortRouteStations, type RouteOrder } from '../lib/route-list';

export type RouteStation = Record<string, any> & { id_ss: number; kmRuta: number; desvioKm: number; masBarataDelTramo: boolean };

const ORDER_OPTIONS: { value: RouteOrder; label: string }[] = [
  { value: 'precio', label: 'Por precio' },
  { value: 'km', label: 'Por km de ruta' },
];
const DEFAULT_ORDER: RouteOrder = 'precio';

interface RouteStationListProps {
  stations: RouteStation[];
  priceColumn: string; // el carburante con el que se pidió la ruta
  activeFilters: string[];
  pinnedIds: Set<number>;
  onTogglePin: (station: any) => void;
}

// Lista de la ruta con su selector de orden. Al calcular otra ruta se monta de nuevo y vuelve a «Por precio».
const RouteStationList: React.FC<RouteStationListProps> = ({ stations, priceColumn, activeFilters, pinnedIds, onTogglePin }) => {
  const [order, setOrder] = useState<RouteOrder>(DEFAULT_ORDER);
  const sorted = sortRouteStations(stations, order, priceColumn);

  return (
    <>
      <label className='flex items-center justify-end gap-3 mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400'>
        Ordenar
        <span className='relative'>
          <select name='route-order' value={order} onChange={(e) => setOrder(e.target.value as RouteOrder)} className='appearance-none border rounded-xl pl-3 pr-8 py-2 font-bold normal-case tracking-normal text-xs outline-none focus:ring-2 focus:ring-primary bg-white astro-dark:bg-white/5 border-gray-100 astro-dark:border-white/10 text-secondary astro-dark:text-white'>
            {ORDER_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown aria-hidden='true' size={14} className='absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40' />
        </span>
      </label>
      <ol className='grid grid-cols-1 gap-2'>
        {sorted.map((station, index) => (
          <li key={station.id_ss}>
            <p className='text-[10px] font-black uppercase tracking-widest ml-2 mb-1 text-gray-400'>
              {routePositionLabel(station)}
              {station.masBarataDelTramo && <span className='ml-2 text-green-600'>Más barata del tramo</span>}
            </p>
            <StationCard station={station} activeFilters={activeFilters} stats={null} isPinned={pinnedIds.has(station.id_ss)} onTogglePin={onTogglePin} index={index} />
          </li>
        ))}
      </ol>
    </>
  );
};

export default RouteStationList;
