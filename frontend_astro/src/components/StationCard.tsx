import React, { useState } from 'react';
import { MapPin, Clock, Fuel, Lock, LockKeyholeOpen, TrendingUp, TrendingDown, Minus, AreaChart, ChevronDown as ChevronIcon } from 'lucide-react';
import PriceChart from './PriceChart';

interface StationProps {
  station: any;
  activeFilters: string[];
  stats: any;
  isPinned?: boolean;
  onTogglePin?: (station: any) => void;
  index?: number;
}

const StationCard: React.FC<StationProps> = ({ station, activeFilters, stats, isPinned, onTogglePin, index = 0 }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
    if (currentPrice > oldPrice) return <TrendingUp size={isLargeDisplay ? 14 : 12} className='text-red-500 ml-1' />;
    if (currentPrice < oldPrice) return <TrendingDown size={isLargeDisplay ? 14 : 12} className='text-green-500 ml-1' />;
    return <Minus size={isLargeDisplay ? 14 : 12} className='text-gray-300 ml-1' />;
  };

  const toggleHistory = async () => {
    if (!isHistoryOpen && historyData.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/history?id=${station.id_ss}`);
        const data = await res.json();
        setHistoryData(data);
      } catch (e) { console.error(e); } finally { setLoadingHistory(false); }
    }
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <div 
      className={`rounded-2xl shadow-sm border mb-3 transition-all group animate-cascade ${
        isPinned 
          ? 'bg-primary/5 border-primary/20 astro-dark:bg-primary/10 astro-dark:border-primary/30 shadow-inner' 
          : 'bg-white border-gray-100 astro-dark:bg-[#151515] astro-dark:border-white/5'
      }`}
      style={{ animationDelay: `${(index % 20) * 0.05}s` }}
    >
      <div className='p-4 desk:py-4 desk:px-6 flex flex-col desk:flex-row desk:items-center relative desk:gap-x-4'>
        
        <button 
          onClick={() => onTogglePin?.(station)}
          className={`absolute top-3 right-3 desk:hidden p-2 rounded-full transition-colors z-10 ${
            isPinned ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 astro-dark:text-white/20'
          }`}
        >
          {isPinned ? <Lock size={16} /> : <LockKeyholeOpen size={16} />}
        </button>

        <div className='flex items-center space-x-4 desk:basis-[35%] min-w-0 flex-shrink desk:pr-8'>
          <div className={`w-10 h-10 desk:w-12 desk:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
            station.rotulo.includes('REPSOL') ? 'bg-orange-50 text-orange-500 astro-dark:bg-orange-500/10' :
            station.rotulo.includes('CEPSA') ? 'bg-red-50 text-red-500 astro-dark:bg-red-500/10' :
            station.rotulo.includes('BP') ? 'bg-green-50 text-green-500 astro-dark:bg-green-500/10' :
            'bg-gray-50 text-gray-400 astro-dark:bg-white/5'
          }`}>
            <Fuel size={24} />
          </div>
          
          <div className='flex-1 min-w-0'>
            <h3 className='font-black text-secondary astro-dark:text-white text-sm desk:text-base leading-tight uppercase truncate'>{station.rotulo}</h3>
            <div className='flex items-center text-gray-400 astro-dark:text-white/40 text-[10px] desk:text-xs mt-1'>
              <MapPin size={10} className='mr-1 shrink-0' />
              <span className='truncate'>{station.direccion}</span>
            </div>
            <div className='flex items-center text-gray-400 astro-dark:text-white/30 text-[9px] mt-0.5 uppercase tracking-wider font-bold'>
              <Clock size={10} className='mr-1' />
              <span>{station.horario}</span>
            </div>
          </div>
        </div>

        <div className='mt-4 desk:mt-0 flex-1 flex items-center justify-center gap-x-4 desk:gap-x-4 border-t desk:border-t-0 border-gray-100/20 astro-dark:border-white/5 pt-4 desk:pt-0 min-w-0'>
          {fuels.map((f) => {
            const price = station[f.key];
            if (!price || price === 0) return null;
            const perc = getPricePercentage(price, f.statKey);
            const barColor = perc < 30 ? 'bg-green-500' : perc < 70 ? 'bg-primary' : 'bg-red-500';
            return (
              <div key={f.key} className={`flex flex-col items-center flex-none flex-shrink-0 ${isLargeDisplay ? 'min-w-[100px] desk:min-w-[120px]' : 'min-w-[65px] desk:min-w-[80px]'}`}>
                <span className={`font-bold text-gray-400 astro-dark:text-white/20 uppercase tracking-tighter mb-1 ${isLargeDisplay ? 'text-[11px] desk:text-xs' : 'text-[9px] desk:text-[10px]'}`}>{f.label}</span>
                <div className='flex flex-col items-center w-fit'>
                  <div className='flex items-center'>
                    <span className={`font-black text-secondary astro-dark:text-white leading-none whitespace-nowrap ${isLargeDisplay ? 'text-[22px] desk:text-3xl' : 'text-[16px] desk:text-xl'}`}>
                      {price.toFixed(3)}€
                    </span>
                    {renderTrend(price, f.historyKey)}
                  </div>
                  <div className={`w-full bg-gray-100 astro-dark:bg-white/5 h-1 rounded-full mt-3 overflow-hidden flex flex-row-reverse`}>
                    <div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${perc}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className='hidden desk:flex basis-[100px] justify-end items-center space-x-1 flex-shrink-0'>
          <button onClick={toggleHistory} className={`p-2.5 rounded-2xl transition-all ${isHistoryOpen ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-gray-50 astro-dark:hover:bg-white/5'}`} title='Ver historial'>
            <AreaChart size={20} />
          </button>
          <button 
            onClick={() => onTogglePin?.(station)}
            className={`p-2.5 rounded-2xl transition-all ${
              isPinned ? 'text-primary bg-primary/10 ring-1 ring-primary/20' : 'text-gray-300 hover:text-secondary hover:bg-gray-50 astro-dark:text-white/20 astro-dark:hover:bg-white/5'
            }`}
          >
            {isPinned ? <Lock size={20} /> : <LockKeyholeOpen size={20} />}
            </button>
        </div>
      </div>

      <button onClick={toggleHistory} className='desk:hidden w-full py-2.5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-300 border-t border-gray-100/20 astro-dark:border-white/5'>
        <AreaChart size={14} className='mr-2' />
        {isHistoryOpen ? 'Cerrar histórico' : 'Ver evolución precios'}
        <ChevronIcon size={14} className={`ml-2 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
      </button>

      {isHistoryOpen && (
        <div className='p-4 desk:px-6 border-t border-gray-100/20 astro-dark:border-white/5 animate-cascade'>
          {loadingHistory ? (
            <div className='py-10 flex justify-center'><div className='animate-spin rounded-full h-6 w-8 border-b-2 border-primary'></div></div>
          ) : (
            <PriceChart data={historyData} activeFilters={activeFilters} />
          )}
        </div>
      )}
    </div>
  );
};

export default StationCard;