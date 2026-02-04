import React, { useState, useEffect, useMemo } from 'react';
import { Search, Fuel as FuelIcon, Droplets, ChevronDown, Check } from 'lucide-react';
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

  // Pinned stations state
  const [pinnedStations, setPinnedStations] = useState<any[]>([]);

  // Load initial data and geolocation
  useEffect(() => {
    // Load pins from localStorage
    const savedPins = localStorage.getItem('fuelwatch_pins');
    if (savedPins) setPinnedStations(JSON.parse(savedPins));

    // Initial search by geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || 'Madrid';
          setSearch(city);
        } catch {
          setSearch('Madrid');
        }
      }, () => setSearch('Madrid'));
    } else {
      setSearch('Madrid');
    }
  }, []);

  // Save pins to localStorage
  useEffect(() => {
    localStorage.setItem('fuelwatch_pins', JSON.stringify(pinnedStations));
  }, [pinnedStations]);

  const togglePin = (station: any) => {
    setPinnedStations(prev => {
      const isAlreadyPinned = prev.find(s => s.id_ss === station.id_ss);
      if (isAlreadyPinned) {
        return prev.filter(s => s.id_ss !== station.id_ss);
      }
      if (prev.length >= 5) {
        alert('Máximo 5 gasolineras fijadas');
        return prev;
      }
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) fetchData(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const availableBrands = useMemo(() => {
    const brands = new Set([...stations, ...pinnedStations].map(s => s.rotulo));
    return Array.from(brands).sort();
  }, [stations, pinnedStations]);

  const filteredResults = useMemo(() => {
    const pinnedIds = new Set(pinnedStations.map(s => s.id_ss));
    // Don't show pinned stations in the search results to avoid duplicates
    return stations.filter(s => !pinnedIds.has(s.id_ss)).filter(s => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(s.rotulo)) return false;
      const prices = [];
      if (activeFilters.includes('diesel')) prices.push(s.precio_diesel);
      if (activeFilters.includes('gasolina')) prices.push(s.precio_gasolina_95);
      const validPrices = prices.filter(p => p > 0);
      if (validPrices.length === 0) return true;
      const minStationPrice = Math.min(...validPrices);
      return minStationPrice <= tempPriceRange.max;
    });
  }, [stations, pinnedStations, selectedBrands, tempPriceRange, activeFilters]);

  const currentStats = stats ? (activeFilters.includes('diesel') ? stats.diesel : stats.gas95) : null;

  return (
    <div className='min-h-screen pb-20 bg-gray-50/50'>
      <div className='bg-secondary text-white p-6 pb-24 shadow-lg'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-2xl font-black mb-6 flex items-center'>
            FUEL <span className='text-primary ml-1'>WATCH</span>
          </h1>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              className='w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400'
              placeholder='Introduce ciudad o código postal...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='max-w-4xl mx-auto px-4 -mt-12'>
        <div className='bg-white rounded-3xl shadow-xl p-6 space-y-6 border border-gray-100'>
          <div className='flex p-1 bg-gray-100 rounded-2xl'>
            <button onClick={() => setActiveFilters(['diesel'])} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('diesel') ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}><Droplets size={18} className='inline mr-2'/>DIÉSEL</button>
            <button onClick={() => setActiveFilters(['gasolina'])} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeFilters.includes('gasolina') ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}><FuelIcon size={18} className='inline mr-2'/>GASOLINA</button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='relative'>
              <button onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)} className='w-full flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 font-bold'>
                <span>{selectedBrands.length ? `${selectedBrands.length} Marcas` : 'Todas las marcas'}</span>
                <ChevronDown size={18}/>
              </button>
              {isBrandDropdownOpen && (
                <div className='absolute z-50 w-full mt-2 bg-white border shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2'>
                  {availableBrands.map(b => (
                    <div key={b} onClick={() => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} className='flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-lg'>
                      <div className={`w-4 h-4 border rounded mr-2 ${selectedBrands.includes(b) ? 'bg-primary' : ''}`}/>
                      <span className='text-sm'>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='px-2'>
              <div className='flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2'><span>Precio Máx</span><span>{tempPriceRange.max.toFixed(2)}€</span></div>
              <input type='range' min='1' max='2.5' step='0.01' value={tempPriceRange.max} onChange={e => setPriceTempRange(p => ({...p, max: parseFloat(e.target.value)}))} className='w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary'/>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-4xl mx-auto p-4 mt-6'>
        {pinnedStations.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 ml-2'>Gasolineras Fijadas</h2>
            {pinnedStations.map(s => (
              <StationCard key={`pin-${s.id_ss}`} station={s} activeFilters={activeFilters} stats={stats} isPinned={true} onTogglePin={togglePin} />
            ))}
            <div className='h-px bg-gray-200 my-8 shadow-sm' />
          </div>
        )}

        <div className='flex justify-between mb-4 px-2'>
          <h2 className='font-black text-secondary uppercase tracking-wider'>Resultados</h2>
          <span className='text-sm text-gray-400 font-bold'>{filteredResults.length} resultados</span>
        </div>

        <div className='grid grid-cols-1 gap-1'>
          {filteredResults.map(s => (
            <StationCard key={s.id_ss} station={s} activeFilters={activeFilters} stats={stats} isPinned={false} onTogglePin={togglePin} />
          ))}
        </div>

        {loading && <div className='flex justify-center py-10'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div></div>}
        {!loading && hasMore && <button onClick={() => fetchData(false)} className='w-full mt-6 py-4 bg-white border border-gray-200 text-secondary font-black rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-sm'>Cargar más</button>}
      </div>
    </div>
  );
};

export default FuelApp;