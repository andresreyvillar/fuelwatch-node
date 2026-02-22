# Component: StationCard

## Archivo: `src/components/StationCard.tsx`

## Proposito

Tarjeta individual de una estacion de servicio. Muestra info de la estacion, precios con tendencia, barra de precio relativo y opcionalmente el grafico de evolucion de precios.

## Props

```typescript
interface StationProps {
  station: any;              // Datos completos de la estacion (con trend)
  activeFilters: string[];   // ['diesel'] y/o ['gasolina']
  stats: any;                // Stats min/max/avg para calcular barras
  isPinned?: boolean;        // Si esta en favoritos
  onTogglePin?: (station: any) => void;
  index?: number;            // Para animacion escalonada (default 0)
}
```

## Estado Interno

| Hook | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `isHistoryOpen` | `boolean` | `false` | Si el chart esta expandido |
| `historyData` | `any[]` | `[]` | Datos del historial (cargado on-demand) |
| `loadingHistory` | `boolean` | `false` | Indicador de carga del historial |

## Datos Derivados

### fuels (array de combustibles a mostrar)

Construido dinamicamente segun `activeFilters`:

```typescript
const fuels = [];
if (activeFilters.includes('diesel')) {
  fuels.push(
    { key: 'precio_diesel',       label: 'Diesel',  statKey: 'diesel',       historyKey: 'diesel' },
    { key: 'precio_diesel_extra',  label: 'Extra',   statKey: 'diesel_extra', historyKey: 'diesel_extra' }
  );
}
if (activeFilters.includes('gasolina')) {
  fuels.push(
    { key: 'precio_gasolina_95',  label: '95',      statKey: 'gas95',        historyKey: 'gas95' },
    { key: 'precio_gasolina_98',  label: '98',      statKey: 'gas98',        historyKey: 'gas98' }
  );
}
```

### isLargeDisplay

```typescript
const isLargeDisplay = activeFilters.length === 1;
```

Cuando solo hay un filtro activo, los precios se muestran mas grandes.

## Funciones

### getPricePercentage(price, statKey)

Calcula el porcentaje del precio dentro del rango min-max de la zona:

```typescript
const s = stats?.[statKey];
if (!s || !s.max || s.max === s.min || !price) return 50;
const perc = ((price - s.min) / (s.max - s.min)) * 100;
return Math.min(Math.max(perc, 5), 95);  // Clamped 5%-95%
```

### renderTrend(currentPrice, historyKey)

Compara precio actual con el de hace 3 dias:

```typescript
const oldPrice = station.trend?.[historyKey];
if (!oldPrice || oldPrice === 0) return null;         // Sin datos -> nada
if (currentPrice > oldPrice) return <TrendingUp />;    // Subida -> rojo
if (currentPrice < oldPrice) return <TrendingDown />;  // Bajada -> verde
return <Minus />;                                      // Igual -> gris
```

| Condicion | Icono | Color | Tamano |
|-----------|-------|-------|--------|
| `current > old` | TrendingUp | `text-red-500` | 14px (large) / 12px |
| `current < old` | TrendingDown | `text-green-500` | 14px (large) / 12px |
| `current === old` | Minus | `text-gray-300` | 14px (large) / 12px |
| Sin datos | null | - | - |

### toggleHistory()

1. Si no esta abierto y no hay datos cargados:
   - `setLoadingHistory(true)`
   - Fetch `/api/history?id={station.id_ss}`
   - `setHistoryData(data)`
   - `setLoadingHistory(false)`
2. Toggle `isHistoryOpen`

**Nota**: Los datos se cargan solo una vez (lazy loading). Si ya se cargaron, solo toggle.

## Estructura de Renderizado

```
div.rounded-2xl.shadow-sm.border.mb-3.animate-cascade
  style: animationDelay = (index % 20) * 0.05s

  Fondo:
    Pinned: bg-primary/5 border-primary/20 shadow-inner
    Normal: bg-white border-gray-100

  ├── Main content (p-4 desk:py-4 desk:px-6, flex-col desk:flex-row)
  │
  │   ├── Pin button (mobile only, absolute top-3 right-3, desk:hidden)
  │   │   Pinned: Lock icon, text-primary bg-primary/10
  │   │   Normal: LockKeyholeOpen icon, text-gray-300
  │   │
  │   ├── Station info (basis-[35%])
  │   │   ├── Brand icon (w-10 h-10 desk:w-12 desk:h-12 rounded-xl)
  │   │   │   Color por marca (ver 04-styles.md)
  │   │   │   Icono: Fuel (24px)
  │   │   └── Text info
  │   │       ├── h3: station.rotulo (font-black uppercase truncate)
  │   │       ├── MapPin + station.direccion (text-[10px] desk:text-xs)
  │   │       └── Clock + station.horario (text-[9px] uppercase)
  │   │
  │   ├── Prices section (flex-1, center, gap-x-4)
  │   │   border-t en mobile, nada en desktop
  │   │   └── {fuels.map -> div por combustible}
  │   │       ├── Label (f.label, uppercase, tracking-tighter)
  │   │       │   Large: text-[11px] desk:text-xs
  │   │       │   Normal: text-[9px] desk:text-[10px]
  │   │       ├── Price + Trend
  │   │       │   ├── span: price.toFixed(3)EUR (font-black)
  │   │       │   │   Large: text-[22px] desk:text-3xl
  │   │       │   │   Normal: text-[16px] desk:text-xl
  │   │       │   └── renderTrend() (ml-1)
  │   │       └── Price bar
  │   │           div.h-1.rounded-full (bg-gray-100)
  │   │             └── div.{barColor} width: {perc}%
  │   │                 <30%: bg-green-500
  │   │                 30-70%: bg-primary
  │   │                 >70%: bg-red-500
  │   │           **flex-row-reverse**: la barra crece de derecha a izquierda
  │   │
  │   └── Action buttons (desktop only, basis-[100px])
  │       ├── History button (AreaChart icon, 20px)
  │       │   Active: bg-primary/10 text-primary
  │       │   Inactive: text-gray-300 hover:bg-gray-50
  │       └── Pin button (Lock/LockKeyholeOpen, 20px)
  │           Pinned: text-primary bg-primary/10 ring-1 ring-primary/20
  │
  ├── History toggle button (mobile only, desk:hidden)
  │   Texto: "Cerrar historico" / "Ver evolucion precios"
  │   AreaChart icon (14px) + ChevronIcon (rotate-180 si abierto)
  │   text-[10px] font-black uppercase tracking-widest text-gray-300
  │
  └── History panel (condicional: isHistoryOpen)
      div.p-4.desk:px-6.border-t.animate-cascade
      ├── Loading: spinner (animate-spin)
      └── Loaded: <PriceChart data={historyData} activeFilters currentPrices={station} />
```

## Imports

```typescript
import { MapPin, Clock, Fuel, Lock, LockKeyholeOpen, TrendingUp, TrendingDown, Minus, AreaChart, ChevronDown as ChevronIcon } from 'lucide-react';
import PriceChart from './PriceChart';
```
