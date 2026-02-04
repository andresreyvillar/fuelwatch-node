import React, { useState, useEffect, useMemo } from 'react';
import { Search, Fuel as FuelIcon, Droplets, ChevronDown, Check, Menu, X } from 'lucide-react';
import StationCard from './StationCard';

const FuelApp: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['diesel', 'gasolina']);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [tempPriceRange, setPriceTempRange] = useState({ min: 0, max: 3 });
  const [pinnedStations, setPinnedStations] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const savedPins = localStorage.getItem('fuelwatch_pins');
    if (savedPins) setPinnedStations(JSON.parse(savedPins));
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const city = 'Madrid';
        setSearch(city);
      }, () => setSearch('Madrid'));
    } else {
      setSearch('Madrid');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fuelwatch_pins', JSON.stringify(pinnedStations));
  }, [pinnedStations]);

  const togglePin = (station: any) => {
    setPinnedStations(prev => {
      const isAlreadyPinned = prev.find(s => s.id_ss === station.id_ss);
      if (isAlreadyPinned) return prev.filter(s => s.id_ss !== station.id_ss);
      if (prev.length >= 5) return prev;
      return [station, ...prev];
    });
  };

  const fetchData = async (resetPage = true) => {
    if (!search) return;
    const currentPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const [stationsRes, statsRes] = await Promise.all([
        fetch(`/api/search?target=${search}&page=${currentPage}&limit=50`),
        fetch(`/api/stats?location=${search}`)
      ]);
      const stationsData = await stationsRes.json();
      const statsData = await statsRes.json();
      if (resetPage) {
        setStations(stationsData.data || []);
        setPage(2);
        if (statsData) {
          const minP = Math.min(statsData.diesel.min || 1, statsData.gas95.min || 1);
          const maxP = Math.max(statsData.diesel.max || 2, statsData.gas95.max || 2);
          setPriceTempRange({ min: minP * 0.9, max: maxP * 1.1 });
        }
      } else {
        setStations(prev => [...prev, ...(stationsData.data || [])]);
        setPage(prev => prev + 1);
      }
      setStats(statsData);
      setTotalCount(stationsData.meta.total);
      setHasMore(stationsData.meta.page < stationsData.meta.lastPage);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (search) fetchData(true); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const availableBrands = useMemo(() => {
    const brands = new Set([...stations, ...pinnedStations].map(s => s.rotulo));
    return Array.from(brands).sort();
  }, [stations, pinnedStations]);

  const filteredResults = useMemo(() => {
    const pinnedIds = new Set(pinnedStations.map(s => s.id_ss));
    return stations.filter(s => !pinnedIds.has(s.id_ss)).filter(s => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(s.rotulo)) return false;
      const prices = [];
      if (activeFilters.includes('diesel')) prices.push(s.precio_diesel);
      if (activeFilters.includes('gasolina')) prices.push(s.precio_gasolina_95);
      const validPrices = prices.filter(p => p > 0);
      if (validPrices.length === 0) return true;
      return Math.min(...validPrices) <= tempPriceRange.max;
    });
  }, [stations, pinnedStations, selectedBrands, tempPriceRange, activeFilters]);

  const currentStats = stats ? (activeFilters.includes('diesel') ? stats.diesel : stats.gas95) : null;

  const SidebarContent = (
    <div className='flex flex-col h-full'>
      <div className='mb-10'>
        <h1 className='text-2xl font-black flex items-center text-white'>FUEL <span className='text-primary ml-1'>WATCH</span></h1>
      </div>
      
      <div className='space-y-8 flex-1'>
        <div>
          <label className='block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1'>Búsqueda</label>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-white/40' size={18} />
            <input type='text' value={search} onChange={e => setSearch(e.target.value)} className='w-full bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-white/20' placeholder='Ciudad o CP...' />
          </div>
        </div>

        <div className='space-y-6'>
          <label className='block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1'>Filtros</label>
          <div className='flex p-1 bg-white/5 rounded-2xl border border-white/5'>
            <button onClick={() => setActiveFilters(['diesel'])} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('diesel') ? 'bg-primary text-white' : 'text-white/40'}`}>DIÉSEL</button>
            <button onClick={() => setActiveFilters(['gasolina'])} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('gasolina') ? 'bg-primary text-white' : 'text-white/40'}`}>GASOLINA</button>
          </div>

          <div className='relative'>
            <button onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)} className='w-full flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white font-bold hover:bg-white/10 transition-all'>
              <span className='truncate'>{selectedBrands.length ? `${selectedBrands.length} Seleccionadas` : 'Todas las marcas'}</span>
              <ChevronDown size={18} />
            </button>
            {isBrandDropdownOpen && (
              <div className='absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2'>
                {availableBrands.map(b => (
                  <div key={b} onClick={() => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} className='flex items-center p-2 hover:bg-white/5 cursor-pointer rounded-lg text-white'>
                    <div className={`w-4 h-4 border border-white/20 rounded mr-3 ${selectedBrands.includes(b) ? 'bg-primary border-primary' : ''}`} />
                    <span className='text-sm'>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className='flex justify-between text-[10px] font-black text-white/40 uppercase mb-3 ml-1'><span>Precio Máx</span><span className='text-primary'>${tempPriceRange.max.toFixed(2)}€</span></div>
            <input type='range' min='1' max='2.5' step='0.01' value={tempPriceRange.max} onChange={e => setPriceTempRange(p => ({...p, max: parseFloat(e.target.value)}))} className='w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary' />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col md:flex-row'>
      {/* Desktop Sidebar (> 800px) */}
      <div className={`hidden md:flex flex-col bg-secondary transition-all duration-300 ease-in-out border-r border-white/5 ${isSidebarOpen ? 'w-80 p-6' : 'w-0 overflow-hidden p-0'}`}>
        {SidebarContent}
      </div>

      {/* Mobile Header (< 800px) */}
      <div className='md:hidden bg-secondary text-white p-4 flex items-center justify-between shadow-lg'>
        <h1 className='text-xl font-black'>FUEL <span className='text-primary'>WATCH</span></h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className='p-2 bg-white/10 rounded-xl'><Menu size={24}/></button>
      </div>

      {/* Main Area */}
      <div className='flex-1 flex flex-col h-screen overflow-y-auto'>
        {/* Header with hamburger for desktop */}
        <div className='hidden md:flex items-center bg-white p-4 border-b border-gray-100 shadow-sm'>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className='p-2 hover:bg-gray-50 rounded-xl transition-colors text-secondary'>
            {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
          {!isSidebarOpen && <h1 className='text-xl font-black ml-4 text-secondary'>FUEL <span className='text-primary'>WATCH</span></h1>}
        </div>

        <div className='max-w-4xl w-full mx-auto p-4 md:p-8'>
          {pinnedStations.length > 0 && (
            <div className='mb-12'>
              <h2 className='text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center ml-1'><span className='w-8 h-px bg-primary/20 mr-3'></span>Favoritos</h2>
              {pinnedStations.map(s => <StationCard key={`pin-${s.id_ss}`} station={s} activeFilters={activeFilters} stats={stats} isPinned={true} onTogglePin={togglePin} />)}
            </div>
          )}

          <div className='flex items-center justify-between mb-6 px-2'>
            <h2 className='font-black text-secondary uppercase tracking-widest text-xs'>Estaciones en {search}</h2>
            <span className='text-[10px] text-gray-400 font-bold'>${filteredResults.length} RESULTADOS</span>
          </div>

          <div className='grid grid-cols-1 gap-2'>
            {filteredResults.map(s => <StationCard key={s.id_ss} station={s} activeFilters={activeFilters} stats={stats} isPinned={false} onTogglePin={togglePin} />)}
          </div>

          {loading && <div className='flex justify-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div></div>}
          {!loading && hasMore && stations.length > 0 && <button onClick={() => fetchData(false)} className='w-full mt-8 py-5 bg-white border border-gray-200 text-secondary font-black rounded-2xl hover:border-primary/30 transition-all uppercase tracking-widest text-[10px] shadow-sm'>Cargar más resultados</button>}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {!isSidebarOpen && window.innerWidth < 768 && (
        <div className='fixed inset-0 z-50 md:hidden'>
          <div className='absolute inset-0 bg-secondary/95 backdrop-blur-md p-6 overflow-y-auto'>
            <div className='flex justify-end mb-6'><button onClick={() => setIsSidebarOpen(true)} className='p-2 bg-white/10 rounded-xl text-white'><X size={24}/></button></div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Stats bar removed for cleaner UI as stats are in filters now, but kept logic if needed */}
    </div>
  );
};

export default FuelApp;