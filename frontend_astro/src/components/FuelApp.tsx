import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Fuel as FuelIcon, Droplets, ChevronDown, Check, Menu, X, Sun, Moon } from 'lucide-react';
import StationCard from './StationCard';

const FilterForm = ({
  isDark, search, setSearch, activeFilters, setActiveFilters, selectedBrands, setSelectedBrands, isBrandDropdownOpen, setIsBrandDropdownOpen, availableBrands, tempPriceRange, setPriceTempRange, suggestions, onSelectSuggestion, isSearchFocused, setIsSearchFocused
}: any) => {
  const toggleFilter = (f: string) => {
    if (activeFilters.includes(f)) {
      if (activeFilters.length > 1) setActiveFilters(activeFilters.filter((x: string) => x !== f));
    } else {
      setActiveFilters([...activeFilters, f]);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Búsqueda</label>
        <div className='relative'>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-gray-400'}`} size={18} />
          <input type='text' value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} className={`w-full border rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all ${isDark ? 'bg-white/10 border-white/10 text-white placeholder-white/20' : 'bg-gray-50 border-gray-100 text-secondary placeholder-gray-400'}`} placeholder='Ciudad o CP...' />
          {isSearchFocused && suggestions.length > 0 && (
            <div className={`absolute z-[70] w-full mt-2 border shadow-2xl rounded-2xl overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'}`}>
              {suggestions.map((s: string) => (
                <div key={s} onClick={() => onSelectSuggestion(s)} className={`px-4 py-3 text-sm cursor-pointer hover:bg-primary/10 transition-colors ${isDark ? 'text-white border-b border-white/5' : 'text-secondary border-b border-gray-50'}`}>{s}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className='space-y-6'>
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Filtros</label>
        <div className={`flex p-2 rounded-2xl border gap-2 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-100'}`}>
          <button onClick={() => toggleFilter('diesel')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('diesel') ? 'bg-primary text-white shadow-md' : isDark ? 'text-white/40' : 'text-gray-400'}`}>DIÉSEL</button>
          <button onClick={() => toggleFilter('gasolina')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('gasolina') ? 'bg-primary text-white shadow-md' : isDark ? 'text-white/40' : 'text-gray-400'}`}>GASOLINA</button>
        </div>
        <div className='relative'>
          <button onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)} className={`w-full flex items-center justify-between border rounded-2xl px-4 py-3 font-bold transition-all ${isDark ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-secondary hover:bg-gray-100'}`}>
            <span className='truncate'>{selectedBrands.length ? `${selectedBrands.length} Marcas` : 'Todas las marcas'}</span>
            <ChevronDown size={18} className={`transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isBrandDropdownOpen && (
            <div className={`absolute z-50 w-full mt-2 border shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2 scrollbar-hide ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setSelectedBrands([])} className='w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg mb-1'>Limpiar selección</button>
              {availableBrands.map((b: string) => (
                <div key={b} onClick={() => setSelectedBrands((prev: string[]) => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} className={`flex items-center p-2 hover:bg-white/5 cursor-pointer rounded-lg ${isDark ? 'text-white' : 'text-secondary'}`}>
                  <div className={`w-4 h-4 border rounded mr-3 ${selectedBrands.includes(b) ? 'bg-primary border-primary' : isDark ? 'border-white/20' : 'border-gray-200'}`} />
                  <span className='text-sm'>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className='flex justify-between text-[10px] font-black uppercase mb-3 ml-1'><span className={isDark ? 'text-white/40' : 'text-gray-400'}>Precio Máx</span><span className='text-primary'>{tempPriceRange.max.toFixed(2)}€</span></div>
          <input type='range' min='1' max='2.5' step='0.01' value={tempPriceRange.max} onChange={e => setPriceTempRange((p: any) => ({...p, max: parseFloat(e.target.value)}))} className='w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary' />
        </div>
      </div>
    </div>
  );
};

const FuelApp: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(['diesel', 'gasolina']);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [tempPriceRange, setPriceTempRange] = useState({ min: 0, max: 3 });
  const [pinnedStations, setPinnedStations] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    const savedPins = localStorage.getItem('fuelwatch_pins');
    if (savedPins) setPinnedStations(JSON.parse(savedPins));
    const savedTheme = localStorage.getItem('fuelwatch_theme') as 'light' | 'dark';
    if (savedTheme) { setTheme(savedTheme); if (savedTheme === 'dark') document.documentElement.classList.add('astro-dark'); }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || 'Madrid';
          setSearch(city); setDebouncedSearch(city);
        } catch { setSearch('Madrid'); setDebouncedSearch('Madrid'); }
      }, () => { setSearch('Madrid'); setDebouncedSearch('Madrid'); });
    } else { setSearch('Madrid'); setDebouncedSearch('Madrid'); }
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.length < 2) { setSuggestions([]); return; }
      try {
        const res = await fetch(`/api/suggestions?q=${search}`);
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { if (isBrowser) localStorage.setItem('fuelwatch_pins', JSON.stringify(pinnedStations)); }, [pinnedStations, isBrowser]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme); localStorage.setItem('fuelwatch_theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('astro-dark'); else document.documentElement.classList.remove('astro-dark');
  };

  const fetchData = async (resetPage = true) => {
    if (!debouncedSearch) return;
    const currentPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const [stationsRes, statsRes] = await Promise.all([
        fetch(`/api/search?target=${debouncedSearch}&page=${currentPage}&limit=50`),
        fetch(`/api/stats?location=${debouncedSearch}`)
      ]);
      const stationsData = await stationsRes.json();
      const statsData = await statsRes.json();
      if (resetPage) {
        setStations(stationsData.data || []); setPage(2);
        if (statsData) {
          const minP = Math.min(statsData.diesel?.min || 1, statsData.gas95?.min || 1);
          const maxP = Math.max(statsData.diesel?.max || 2, statsData.gas95?.max || 2);
          setPriceTempRange({ min: minP * 0.9, max: maxP * 1.1 });
        }
      } else {
        setStations(prev => [...prev, ...(stationsData.data || [])]); setPage(prev => prev + 1);
      }
      setStats(statsData); setTotalCount(stationsData.meta.total); setHasMore(stationsData.meta.page < stationsData.meta.lastPage);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { if (debouncedSearch) fetchData(true); }, [debouncedSearch]);

  const togglePin = (station: any) => {
    setPinnedStations(prev => {
      const isAlreadyPinned = prev.find(s => s.id_ss === station.id_ss);
      if (isAlreadyPinned) return prev.filter(s => s.id_ss !== station.id_ss);
      if (prev.length >= 5) return prev;
      return [station, ...prev];
    });
  };

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

  const filterProps = { search, setSearch, activeFilters, setActiveFilters, selectedBrands, setSelectedBrands, isBrandDropdownOpen, setIsBrandDropdownOpen, availableBrands, tempPriceRange, setPriceTempRange, suggestions, isSearchFocused, setIsSearchFocused, onSelectSuggestion: (s: string) => { setSearch(s); setDebouncedSearch(s); setSuggestions([]); setIsSearchFocused(false); } };

  return (
    <div className='h-screen bg-gray-50 astro-dark:bg-[#0a0a0a] flex flex-col lg:flex-row transition-colors duration-300 overflow-hidden'>
      {isSidebarOpen && <div className='fixed inset-0 z-[100] lg:hidden bg-secondary/20 backdrop-blur-sm' onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed lg:relative z-[110] h-full bg-secondary transition-all duration-300 ease-in-out border-r border-white/5 ${isSidebarOpen ? 'translate-x-0 w-80 p-6' : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden p-0'}`}>
        <div className='flex flex-col h-full overflow-hidden'>
          <div className='mb-10 shrink-0 flex items-center justify-between'><h1 className='text-2xl font-black flex items-center text-white'>FUEL <span className='text-primary ml-1'>WATCH</span></h1><button onClick={() => setIsSidebarOpen(false)} className='lg:hidden text-white/40 hover:text-white'><X size={24}/></button></div>
          <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar'><FilterForm isDark={true} {...filterProps} /></div>
          <div className='mt-6 pt-6 border-t border-white/5 shrink-0'><button onClick={toggleTheme} className='w-full flex items-center justify-center space-x-3 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all'>{theme === 'light' ? <><Moon size={18}/><span>Modo Oscuro</span></> : <><Sun size={18}/><span>Modo Claro</span></>}</button></div>
        </div>
      </aside>
      <div className='flex-1 flex flex-col h-full overflow-hidden'>
        <header className='bg-secondary lg:bg-white astro-dark:lg:bg-[#111] p-4 flex items-center border-b border-gray-100 astro-dark:border-white/5 shadow-sm shrink-0 transition-colors z-50 sticky top-0'>
          <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-xl transition-colors ${isSidebarOpen ? 'lg:opacity-100' : 'bg-white/10 lg:bg-gray-100 text-white lg:text-secondary astro-dark:lg:text-white'}`}><Menu size={24}/></button>
          <h1 className={`text-xl font-black ml-4 lg:text-secondary text-white astro-dark:md:text-white transition-all`}>FUEL <span className='text-primary'>WATCH</span></h1>
          <div className='flex-1' /><div className='hidden lg:block'><button onClick={toggleTheme} className='p-2 bg-gray-100 astro-dark:bg-white/5 rounded-xl text-secondary astro-dark:text-white'>{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button></div>
        </header>
        <div className='flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8'><div className='max-w-4xl w-full mx-auto'>
          {pinnedStations.length > 0 && (<div className='mb-12'><h2 className='text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center ml-1'><span className='w-8 h-px bg-primary/20 mr-3'></span>Favoritos</h2>{pinnedStations.map((s, idx) => <StationCard key={`pin-${s.id_ss}`} station={s} activeFilters={activeFilters} stats={stats} isPinned={true} onTogglePin={togglePin} index={idx} />)}</div>)}
          <div className='flex items-center justify-between mb-6 px-2'><h2 className='font-black text-secondary astro-dark:text-white uppercase tracking-widest text-xs'>Estaciones en {debouncedSearch || '...'}</h2><span className='text-[10px] text-gray-400 font-bold'>{filteredResults.length} RESULTADOS</span></div>
          {filteredResults.length === 0 && !loading && debouncedSearch && (<div className='py-20 text-center animate-cascade'><div className='bg-white astro-dark:bg-white/5 rounded-3xl p-10 shadow-sm border border-gray-100 astro-dark:border-white/5'><Search size={48} className='mx-auto text-gray-200 mb-4' /><p className='text-secondary astro-dark:text-white font-bold'>No hay resultados para "{search}"</p><p className='text-gray-400 text-sm mt-1'>Prueba a seleccionar una de las sugerencias.</p></div></div>)}
          <div className='grid grid-cols-1 gap-2'>{filteredResults.map((s, idx) => <StationCard key={s.id_ss} station={s} activeFilters={activeFilters} stats={stats} isPinned={false} onTogglePin={togglePin} index={idx + pinnedStations.length} />)}</div>
          {loading && <div className='flex justify-center py-12'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div></div>}
          {!loading && hasMore && stations.length > 0 && <button onClick={() => fetchData(false)} className='w-full mt-8 py-5 bg-white astro-dark:bg-white/5 border border-gray-200 astro-dark:border-white/10 text-secondary astro-dark:text-white font-black rounded-2xl hover:border-primary/30 transition-all uppercase tracking-widest text-[10px] shadow-sm'>Cargar más resultados</button>}
        </div></div>
      </div>
    </div>
  );
};

export default FuelApp;