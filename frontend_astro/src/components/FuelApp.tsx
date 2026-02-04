import React, { useState, useEffect } from 'react';
import { Search, Filter, Fuel as FuelIcon, Droplets } from 'lucide-react';
import StationCard from './StationCard';

const FuelApp: React.FC = () => {
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('Madrid');
  const [activeFilters, setActiveFilters] = useState<string[]>(['diesel', 'gasolina']);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

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
        fetch(`/api/search?target=${search}&page=${currentPage}&limit=20`),
        fetch(`/api/stats?location=${search}`)
      ]);
      
      const stationsData = await stationsRes.json();
      const statsData = await statsRes.json();
      
      if (resetPage) {
        setStations(stationsData.data);
        setPage(2);
      } else {
        setStations(prev => [...prev, ...stationsData.data]);
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

  const currentStats = stats ? (activeFilters.includes('diesel') ? stats.diesel : stats.gas95) : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Header / Search */}
      <div className="bg-secondary text-white p-6 pb-20 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black mb-6 flex items-center">
            FUEL <span className="text-primary ml-1">WATCH</span>
          </h1>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              placeholder="Introduce ciudad o código postal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters Overlay */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl p-2 flex space-x-1">
          <button
            onClick={() => toggleFilter('diesel')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all ${
              activeFilters.includes('diesel') ? 'bg-primary text-white shadow-md' : 'text-gray-400 bg-gray-50'
            }`}
          >
            <Droplets size={18} className="mr-2" />
            DIÉSEL
          </button>
          <button
            onClick={() => toggleFilter('gasolina')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all ${
              activeFilters.includes('gasolina') ? 'bg-primary text-white shadow-md' : 'text-gray-400 bg-gray-50'
            }`}
          >
            <FuelIcon size={18} className="mr-2" />
            GASOLINA
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 mt-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-black text-secondary uppercase tracking-wider">Gasolineras en {search}</h2>
          <span className="text-sm text-gray-400 font-bold">{totalCount} resultados</span>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {stations.map((s) => (
            <StationCard 
              key={`${s.id_ss}-${s.fecha_actualizacion}`} 
              station={s} 
              activeFilters={activeFilters} 
              stats={stats} 
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && hasMore && stations.length > 0 && (
          <button
            onClick={() => fetchData(false)}
            className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-secondary font-black rounded-2xl transition-colors uppercase tracking-widest text-sm"
          >
            Cargar más estaciones
          </button>
        )}
      </div>

      {/* Sticky Bottom Stats (Mobile view logic) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:hidden flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
         <div className="text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Mínimo</p>
            <p className="text-lg font-black text-green-500 leading-none">
              {currentStats?.min.toFixed(3) || '---'}€
            </p>
         </div>
         <div className="text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Medio</p>
            <p className="text-lg font-black text-primary leading-none">
              {currentStats?.avg.toFixed(3) || '---'}€
            </p>
         </div>
         <div className="text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Máximo</p>
            <p className="text-lg font-black text-red-500 leading-none">
              {currentStats?.max.toFixed(3) || '---'}€
            </p>
         </div>
      </div>
    </div>
  );
};

export default FuelApp;
