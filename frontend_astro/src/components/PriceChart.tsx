import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  data: any[];
  activeFilters: string[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data, activeFilters }) => {
  if (!data || data.length === 0) return <div className='py-10 text-center text-gray-400 text-sm'>No hay datos históricos suficientes aún.</div>;

  const formattedData = data.map(d => ({
    ...d,
    displayDate: new Date(d.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }));

  return (
    <div className='w-full h-64 mt-4 bg-gray-50/50 astro-dark:bg-white/5 rounded-2xl p-2 desk:p-4'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={formattedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e7eb' opacity={0.5} />
          <XAxis 
            dataKey='displayDate' 
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            tick={{ fill: '#9ca3af' }}
            minTickGap={30}
          />
          <YAxis 
            orientation='right'
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            tick={{ fill: '#9ca3af' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${value.toFixed(2)}€`}
            width={45}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
          {/* Diesel - Solid Blue */}
          <Line 
            type='monotone' 
            dataKey='diesel' 
            name='Diésel' 
            stroke='#3b82f6' 
            strokeWidth={3} 
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} 
            activeDot={{ r: 5 }}
            connectNulls
          />
          {/* Diesel Extra - Solid Dark Blue */}
          <Line 
            type='monotone' 
            dataKey='diesel_extra' 
            name='Diésel+' 
            stroke='#1d4ed8' 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 0 }}
            connectNulls
          />
          {/* Gasolina 95 - Solid Amber */}
          <Line 
            type='monotone' 
            dataKey='gas95' 
            name='95' 
            stroke='#f59e0b' 
            strokeWidth={3} 
            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
            connectNulls
          />
          {/* Gasolina 98 - Solid Brown */}
          <Line 
            type='monotone' 
            dataKey='gas98' 
            name='98' 
            stroke='#b45309' 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#b45309', strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;