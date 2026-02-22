# Component: PriceChart

## Archivo: `src/components/PriceChart.tsx`

## Proposito

Grafico de lineas que muestra la evolucion de precios de una estacion durante los ultimos 30 dias. Usa la libreria Recharts.

## Props

```typescript
interface PriceChartProps {
  data: any[];               // Array de HistoryEntry del API /api/history
  activeFilters: string[];   // ['diesel'] y/o ['gasolina']
  currentPrices?: any;       // Objeto Station completo (para sincronizar precio de hoy)
}
```

## Logica de Datos

### 1. Empty state

Si `!data || data.length === 0`:
```html
<div class="py-10 text-center text-gray-400 text-sm">
  No hay datos historicos suficientes aun.
</div>
```

### 2. Sincronizar precio de hoy

Si `currentPrices` esta definido:

```typescript
const today = new Date().toISOString().split('T')[0];
const todayData = {
  fecha: today,
  diesel: currentPrices.precio_diesel,
  diesel_extra: currentPrices.precio_diesel_extra,
  gas95: currentPrices.precio_gasolina_95,
  gas98: currentPrices.precio_gasolina_98
};

// Si el ultimo punto es de hoy, actualizarlo
if (lastItem.fecha === today) {
  chartData[last] = { ...lastItem, ...todayData };
} else {
  // Sino, agregar nuevo punto
  chartData.push(todayData);
}
```

**Proposito**: Asegura que el grafico muestre el precio actual exacto, incluso si `price_history` aun no se ha actualizado hoy.

### 3. Formato de fechas

```typescript
const formattedData = chartData.map(d => ({
  ...d,
  displayDate: new Date(d.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}));
// Ejemplo: "22 feb"
```

### 4. Filtros de lineas

```typescript
const showDiesel = activeFilters.includes('diesel');
const showGasolina = activeFilters.includes('gasolina');
```

## Estructura del Chart

```
div.w-full.h-64.mt-4.bg-gray-50/50.astro-dark:bg-white/5.rounded-2xl.p-2.desk:p-4
└── ResponsiveContainer width="100%" height="100%"
    └── LineChart data={formattedData} margin={{ top:5, right:5, left:0, bottom:5 }}
        ├── CartesianGrid
        │   strokeDasharray="3 3"
        │   vertical={false}
        │   stroke="#e5e7eb"
        │   opacity={0.5}
        ├── XAxis
        │   dataKey="displayDate"
        │   axisLine={false}, tickLine={false}
        │   fontSize={10}
        │   tick={{ fill: '#9ca3af' }}
        │   minTickGap={30}
        ├── YAxis
        │   orientation="right"
        │   axisLine={false}, tickLine={false}
        │   fontSize={10}
        │   tick={{ fill: '#9ca3af' }}
        │   domain={['auto', 'auto']}
        │   tickFormatter: "{value.toFixed(2)}EUR"
        │   width={45}
        ├── Tooltip
        │   contentStyle: borderRadius 12px, no border, shadow, white bg, 12px bold
        ├── Line: diesel (si showDiesel)
        │   type="monotone", dataKey="diesel", name="Diesel"
        │   stroke="#3b82f6", strokeWidth={3}
        │   dot={{ r:3, fill:'#3b82f6', strokeWidth:0 }}
        │   activeDot={{ r:5 }}
        │   connectNulls
        ├── Line: diesel_extra (si showDiesel)
        │   stroke="#1d4ed8", strokeWidth={2}
        │   dot={{ r:3, fill:'#1d4ed8', strokeWidth:0 }}
        │   connectNulls
        ├── Line: gas95 (si showGasolina)
        │   stroke="#f59e0b", strokeWidth={3}
        │   dot={{ r:3, fill:'#f59e0b', strokeWidth:0 }}
        │   connectNulls
        └── Line: gas98 (si showGasolina)
            stroke="#b45309", strokeWidth={2}
            dot={{ r:3, fill:'#b45309', strokeWidth:0 }}
            connectNulls
```

## Lineas del Chart

| dataKey | name | Color | Grosor | Dot | Condicion |
|---------|------|-------|--------|-----|-----------|
| `diesel` | Diesel | `#3b82f6` | 3 | r:3 + activeDot r:5 | showDiesel |
| `diesel_extra` | Diesel+ | `#1d4ed8` | 2 | r:3 | showDiesel |
| `gas95` | 95 | `#f59e0b` | 3 | r:3 | showGasolina |
| `gas98` | 98 | `#b45309` | 2 | r:3 | showGasolina |

Todas las lineas usan `connectNulls` para manejar dias sin datos.

## Imports

```typescript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
```
