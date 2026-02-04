import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Fuel as FuelIcon, Droplets, ChevronDown, Check } from 'lucide-react';
import StationCard from './StationCard';

const FuelApp: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('Madrid');
  const [activeFilters, setActiveFilters] = useState<string[]>(['diesel', 'gasolina']);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // New states for brand filtering
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  // New states for price range
  const [priceRange, setPriceRange] = useState({ min: 0, max: 3 });
  const [tempPriceRange, setPriceTempRange] = useState({ min: 0, max: 3 });

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const fetchData = async (resetPage = true) => {
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
        // Reset price range based on new stats
        if (statsData) {
          const minP = Math.min(statsData.diesel.min, statsData.gas95.min);
          const maxP = Math.max(statsData.diesel.max, statsData.gas95.max);
          setPriceRange({ min: minP * 0.9, max: maxP * 1.1 });
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

  // Extract unique brands from loaded stations
  const availableBrands = useMemo(() => {
    const brands = new Set(stations.map(s => s.rotulo));
    return Array.from(brands).sort();
  }, [stations]);

  // Filter stations client-side for immediate feedback
  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(s.rotulo)) return false;
      
      // Price filter (depends on active fuel type)
      const prices = [];
      if (activeFilters.includes('diesel')) prices.push(s.precio_diesel, s.precio_diesel_extra);
      if (activeFilters.includes('gasolina')) prices.push(s.precio_gasolina_95, s.precio_gasolina_98);
      
      const validPrices = prices.filter(p => p > 0);
      if (validPrices.length === 0) return true; // Show if no price data for active fuel (optional)
      
      const minStationPrice = Math.min(...validPrices);
      return minStationPrice >= tempPriceRange.min && minStationPrice <= tempPriceRange.max;
    });
  }, [stations, selectedBrands, tempPriceRange, activeFilters]);

  const currentStats = stats ? (activeFilters.includes('diesel') ? stats.diesel : stats.gas95) : null;

  return (
    <div className='min-h-screen pb-20'>
      {/* Header / Search */}
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

      {/* Filters Section */}
      <div className='max-w-4xl mx-auto px-4 -mt-12'>
        <div className='bg-white rounded-3xl shadow-xl p-6 space-y-6'>
          {/* Fuel Toggle */}
          <div className='flex p-1 bg-gray-100 rounded-2xl'>
            <button
              onClick={() => toggleFilter('diesel')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all ${
                activeFilters.includes('diesel') ? 'bg-primary text-white shadow-md' : 'text-gray-400'
              }`}
            >
              <Droplets size={18} className='mr-2' />
              DIÉSEL
            </button>
            <button
              onClick={() => toggleFilter('gasolina')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all ${
                activeFilters.includes('gasolina') ? 'bg-primary text-white shadow-md' : 'text-gray-400'
              }`}
            >
              <FuelIcon size={18} className='mr-2' />
              GASOLINA
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Brand Dropdown */}
            <div className='relative'>
              <label className='block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1'>Marca</label>
              <button 
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className='w-full flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-secondary font-bold hover:bg-gray-100 transition-colors'
              >
                <span className='truncate'>
                  {selectedBrands.length === 0 ? 'Todas las marcas' : `${selectedBrands.length} seleccionadas`}
                </span>
                <ChevronDown size={18} className={`transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isBrandDropdownOpen && (
                <div className='absolute z-50 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2'>
                  <button 
                    onClick={() => setSelectedBrands([])}
                    className='w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg mb-1'
                  >
                    Limpiar selección
                  </button>
                  {availableBrands.map(brand => (
                    <label key={brand} className='flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
                      <input 
                        type='checkbox' 
                        className='hidden'
                        checked={selectedBrands.includes(brand)}
                        onChange={() => {
                          setSelectedBrands(prev => 
                            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                          );
                        }}
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
                        selectedBrands.includes(brand) ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                      }`}>
                        {selectedBrands.includes(brand) && <Check size={14} className='text-white' />}
                      </div>
                      <span className='text-sm font-medium text-secondary truncate'>{brand}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Slider */}
            <div>
              <div className='flex justify-between items-end mb-2 ml-1'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Rango de Precio</label>
                <span className='text-xs font-bold text-secondary'>${tempPriceRange.min.toFixed(2)}€ - ${tempPriceRange.max.toFixed(2)}€</span>
              </div>
              <div className='px-2'>
                <input 
                  type='range' 
                  min={stats?.diesel.min * 0.8 || 1} 
                  max={stats?.gas95.max * 1.2 || 2.5} 
                  step='0.01'
                  value={tempPriceRange.max}
                  onChange={(e) => setPriceTempRange(prev => ({ ...prev, max: parseFloat(e.target.value) }))}
                  className='w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto p-4 mt-6'>
        <div className='flex items-center justify-between mb-4 px-2'>
          <h2 className='font-black text-secondary uppercase tracking-wider'>Gasolineras en {search}</h2>
          <span className='text-sm text-gray-400 font-bold'>{filteredStations.length} de {totalCount}</span>
        </div>

        <div className='grid grid-cols-1 gap-1'>
          {filteredStations.map((s) => (
            <StationCard 
              key={`${s.id_ss}-${s.fecha_actualizacion}`} 
              station={s} 
              activeFilters={activeFilters} 
              stats={stats} 
            />
          ))}
        </div>

        {loading && (
          <div className='flex justify-center py-10'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        )}

        {!loading && hasMore && stations.length > 0 && (
          <button
            onClick={() => fetchData(false)}
            className='w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-secondary font-black rounded-2xl transition-colors uppercase tracking-widest text-sm'
          >
            Cargar más estaciones
          </button>
        )}
      </div>

      {/* Sticky Bottom Stats (Mobile view logic) */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:hidden flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50'>
         <div className='text-center'>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-tighter'>Mínimo</p>
            <p className='text-lg font-black text-green-500 leading-none'>
              {currentStats?.min.toFixed(3) || '---'}€
            </p>
         </div>
         <div className='text-center'>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-tighter'>Medio</p>
            <p className='text-lg font-black text-primary leading-none'>
              {currentStats?.avg.toFixed(3) || '---'}€
            </p>
         </div>
         <div className='text-center'>
            <p className='text-[10px] text-gray-400 font-bold uppercase tracking-tighter'>Máximo</p>
            <p className='text-lg font-black text-red-500 leading-none'>
              {currentStats?.max.toFixed(3) || '---'}€
            </p>
         </div>
      </div>
    </div>
  );
};

export default FuelApp;