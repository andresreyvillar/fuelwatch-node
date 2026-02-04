import React from 'react';
import { MapPin, Clock, Fuel, Lock, LockKeyholeOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StationProps {
  station: any;
  activeFilters: string[];
  stats: any;
  isPinned?: boolean;
  onTogglePin?: (station: any) => void;
  index?: number;
}

const StationCard: React.FC<StationProps> = ({ station, activeFilters, stats, isPinned, onTogglePin, index = 0 }) => {
  const fuels = [];
  if (activeFilters.includes('diesel')) {
    fuels.push(
      { key: 'precio_diesel', label: 'Diésel', statKey: 'diesel', historyKey: 'diesel' },
      { key: 'precio_diesel_extra', label: 'Extra', statKey: 'diesel_extra', historyKey: 'diesel_extra' }
    );
  }
  if (activeFilters.includes('gasolina')) {
    fuels.push(
      { key: 'precio_gasolina_95', label: '95', statKey: 'gas95', historyKey: 'gas95' },
      { key: 'precio_gasolina_98', label: '98', statKey: 'gas98', historyKey: 'gas98' }
    );
  }

  const isLargeDisplay = activeFilters.length === 1;

  const getPricePercentage = (price: number, statKey: string) => {
    const s = stats?.[statKey];
    if (!s || !s.max || s.max === s.min || !price) return 50;
    const perc = ((price - s.min) / (s.max - s.min)) * 100;
    return Math.min(Math.max(perc, 5), 95);
  };

  const renderTrend = (currentPrice: number, historyKey: string) => {
    const oldPrice = station.trend?.[historyKey];
    if (!oldPrice || oldPrice === 0) return null;
    
    if (currentPrice > oldPrice) return <TrendingUp size={12} className='text-red-500 ml-1' />;
    if (currentPrice < oldPrice) return <TrendingDown size={12} className='text-green-500 ml-1' />;
    return <Minus size={12} className='text-gray-300 ml-1' />;
  };

  return (
    <div 
      className={`rounded-2xl shadow-sm border p-4 lg:p-5 mb-3 flex flex-col lg:flex-row lg:items-center justify-between hover:shadow-md transition-all group relative animate-cascade ${
        isPinned 
          ? 'bg-primary/5 border-primary/20 astro-dark:bg-primary/10 astro-dark:border-primary/30 shadow-inner' 
          : 'bg-white border-gray-100 astro-dark:bg-[#151515] astro-dark:border-white/5'
      }`}
      style={{ animationDelay: `${(index % 20) * 0.05}s` }}
    >
      <button 
        onClick={() => onTogglePin?.(station)}
        className={`absolute top-3 right-3 p-2 rounded-full transition-colors z-10 ${
          isPinned 
            ? 'text-primary bg-primary/10' 
            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 astro-dark:text-white/20 astro-dark:hover:text-white/40 astro-dark:hover:bg-white/5'
        }`}
      >
        {isPinned ? <Lock size={16} /> : <LockKeyholeOpen size={16} />}
      </button>

      <div className='flex items-start space-x-4 lg:w-5/12'>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
          station.rotulo.includes('REPSOL') ? 'bg-orange-50 text-orange-500 astro-dark:bg-orange-500/10' :
          station.rotulo.includes('CEPSA') ? 'bg-red-50 text-red-500 astro-dark:bg-red-500/10' :
          station.rotulo.includes('BP') ? 'bg-green-50 text-green-500 astro-dark:bg-green-500/10' :
          'bg-gray-50 text-gray-400 astro-dark:bg-white/5'
        }`}>
          <Fuel size={20} className='lg:hidden' />
          <Fuel size={24} className='hidden lg:block' />
        </div>
        
        <div className='flex-1 min-w-0 pr-8'>
          <h3 className='font-black text-secondary astro-dark:text-white text-sm lg:text-base leading-tight uppercase truncate'>{station.rotulo}</h3>
          <div className='flex items-center text-gray-400 astro-dark:text-white/40 text-[10px] lg:text-xs mt-1'>
            <MapPin size={10} className='mr-1 shrink-0' />
            <span className='truncate'>{station.direccion}</span>
          </div>
          <div className='flex items-center text-gray-400 astro-dark:text-white/30 text-[9px] mt-0.5 uppercase tracking-wider font-bold'>
            <Clock size={10} className='mr-1' />
            <span>{station.horario}</span>
          </div>
        </div>
      </div>

      <div className='mt-3 lg:mt-0 flex-1 flex items-center justify-center lg:justify-end gap-x-2 lg:gap-x-10 border-t lg:border-t-0 lg:border-l border-gray-50 astro-dark:border-white/5 pt-4 lg:pt-0'>
        {fuels.map((f) => {
          const price = station[f.key];
          if (!price || price === 0) return null;
          const perc = getPricePercentage(price, f.statKey);
          const barColor = perc < 30 ? 'bg-green-500' : perc < 70 ? 'bg-primary' : 'bg-red-500';
          return (
            <div key={f.key} className={`flex flex-col items-center lg:items-end flex-1 lg:flex-none min-w-0 ${isLargeDisplay ? 'scale-125 lg:scale-100' : ''}`}>
              <span className='text-[9px] lg:text-[10px] font-bold text-gray-400 astro-dark:text-white/20 uppercase tracking-tighter mb-1'>{f.label}</span>
              <div className='flex flex-col items-center lg:items-end w-fit'>
                <div className='flex items-center'>
                  <span className={`font-black text-secondary astro-dark:text-white leading-none whitespace-nowrap ${isLargeDisplay ? 'text-[20px] lg:text-2xl' : 'text-[16px] lg:text-xl'}`}>
                    {price.toFixed(3)}€
                  </span>
                  {renderTrend(price, f.historyKey)}
                </div>
                <div className='w-full bg-gray-100 astro-dark:bg-white/5 h-1 rounded-full mt-4 overflow-hidden flex flex-row-reverse'>
                  <div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${perc}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationCard;