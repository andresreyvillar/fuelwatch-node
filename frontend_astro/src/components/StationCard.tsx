import React from 'react';
import { MapPin, Clock, Info, Fuel, Droplets, Lock, LockKeyholeOpen } from 'lucide-react';

interface StationProps {
  station: any;
  activeFilters: string[];
  stats: any;
  isPinned?: boolean;
  onTogglePin?: (station: any) => void;
}

const StationCard: React.FC<StationProps> = ({ station, activeFilters, stats, isPinned, onTogglePin }) => {
  const fuels = [];
  
  if (activeFilters.includes('diesel')) {
    fuels.push(
      { key: 'precio_diesel', label: 'Diésel', statKey: 'diesel' },
      { key: 'precio_diesel_extra', label: 'Diésel+', statKey: 'diesel_extra' }
    );
  }
  
  if (activeFilters.includes('gasolina')) {
    fuels.push(
      { key: 'precio_gasolina_95', label: '95', statKey: 'gas95' },
      { key: 'precio_gasolina_98', label: '98', statKey: 'gas98' }
    );
  }

  const getPricePercentage = (price: number, statKey: string) => {
    const s = stats?.[statKey];
    if (!s || !s.max || s.max === s.min || !price) return 50;
    const perc = ((price - s.min) / (s.max - s.min)) * 100;
    return Math.min(Math.max(perc, 5), 95);
  };

  return (
    <div className={`rounded-xl shadow-sm border p-4 mb-3 flex flex-col lg:flex-row lg:items-center justify-between hover:shadow-md transition-all group relative ${isPinned ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-white border-gray-100'}`}>
      <button 
        onClick={() => onTogglePin?.(station)}
        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isPinned ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
      >
        {isPinned ? <Lock size={16} /> : <LockKeyholeOpen size={16} />}
      </button>

      <div className='flex items-start space-x-4 lg:w-1/3'>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
          station.rotulo.includes('REPSOL') ? 'bg-orange-50 text-orange-500' :
          station.rotulo.includes('CEPSA') ? 'bg-red-50 text-red-500' :
          station.rotulo.includes('BP') ? 'bg-green-50 text-green-500' :
          'bg-gray-50 text-gray-400'
        }`}>
          <Fuel size={24} />
        </div>
        
        <div className='flex-1 min-w-0 pr-8'>
          <h3 className='font-black text-secondary text-base leading-tight uppercase truncate'>{station.rotulo}</h3>
          <div className='flex items-center text-gray-400 text-xs mt-1'>
            <MapPin size={12} className='mr-1 shrink-0' />
            <span className='truncate'>{station.direccion}</span>
          </div>
          <div className='flex items-center text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold'>
            <Clock size={10} className='mr-1' />
            <span>{station.horario}</span>
          </div>
        </div>
      </div>

      <div className='mt-4 lg:mt-0 flex-1 flex flex-wrap gap-x-8 gap-y-4 lg:pl-8 border-t lg:border-t-0 lg:border-l border-gray-50 pt-4 lg:pt-0 justify-end pr-4'>
        {fuels.map((f) => {
          const price = station[f.key];
          if (!price || price === 0) return null;
          const perc = getPricePercentage(price, f.statKey);
          const barColor = perc < 30 ? 'bg-green-500' : perc < 70 ? 'bg-primary' : 'bg-red-500';
          return (
            <div key={f.key} className='flex flex-col min-w-[80px]'>
              <span className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-right'>{f.label}</span>
              <span className='text-xl font-black text-secondary leading-none mt-1 text-right'>{price.toFixed(3)}</span>
              <div className='w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden flex flex-row-reverse'>
                <div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${perc}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationCard;