# Component: FuelApp

## Archivo: `src/components/FuelApp.tsx`

## Proposito

Componente React principal de la aplicacion. Gestiona todo el estado global, efectos, persistencia en localStorage, geolocalizacion y renderiza el layout completo (sidebar + contenido).

## Estado (Hooks)

| Hook | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `stations` | `any[]` | `[]` | Resultados de busqueda actuales |
| `stats` | `any` | `null` | Stats min/max/avg de la busqueda actual |
| `search` | `string` | `""` | Texto del input de busqueda |
| `debouncedSearch` | `string` | `""` | Busqueda con debounce de 1000ms |
| `suggestions` | `string[]` | `[]` | Sugerencias de autocompletado |
| `activeFilters` | `string[]` | `['diesel', 'gasolina']` | Filtros de combustible activos |
| `sortBy` | `string` | `'price_asc'` | Criterio de ordenacion |
| `loading` | `boolean` | `false` | Indicador de carga |
| `page` | `number` | `1` | Pagina actual de paginacion |
| `hasMore` | `boolean` | `true` | Si hay mas paginas disponibles |
| `totalCount` | `number` | `0` | Total de resultados |
| `selectedBrands` | `string[]` | `[]` | Marcas seleccionadas (filtro) |
| `isBrandDropdownOpen` | `boolean` | `false` | Estado del dropdown de marcas |
| `tempPriceRange` | `{min, max}` | `{min: 0, max: 3}` | Rango de precio maximo |
| `pinnedStations` | `any[]` | `[]` | Estaciones favoritas (con datos completos) |
| `isSidebarOpen` | `boolean` | `false` | Estado del sidebar (mobile) |
| `isBrowser` | `boolean` | `false` | Flag para evitar SSR issues con localStorage |
| `theme` | `'light' \| 'dark'` | `'light'` | Tema actual |
| `isSearchFocused` | `boolean` | `false` | Si el input de busqueda tiene focus |

### Refs

| Ref | Tipo | Uso |
|-----|------|-----|
| `touchStartX` | `number \| null` | Posicion X inicial del touch para gestos swipe |

## Efectos (useEffect)

### 1. Inicializacion (mount) - `[]`

Se ejecuta una sola vez al montar:

1. `setIsBrowser(true)`
2. **Cargar favoritos**: Lee `fuelwatch_pins` de localStorage
   - Parsea como array de IDs (soporta formato legacy con objetos completos)
   - Si hay IDs, fetch fresco via `/api/search?ids={ids}&t={timestamp}` (cache bust)
   - `setPinnedStations(result.data)`
3. **Restaurar estado** de localStorage:
   - `fuelwatch_last_search` -> `search` + `debouncedSearch`
   - `fuelwatch_active_filters` -> `activeFilters` (JSON)
   - `fuelwatch_selected_brands` -> `selectedBrands` (JSON)
   - `fuelwatch_sort_by` -> `sortBy`
   - `fuelwatch_theme` -> `theme` + toggle clase `astro-dark`
4. **Geolocalizacion** (si no hay busqueda guardada):
   - Intenta `navigator.geolocation.getCurrentPosition()`
   - Success: Reverse geocode via Nominatim (`city || town || village || 'Madrid'`)
   - Error/denied: Fallback a IP via `ipapi.co/json/` (`city || 'Madrid'`)
   - Ultimo fallback: `'Madrid'`
5. **Desktop sidebar**: Si `window.innerWidth >= 800`, abre sidebar
6. **Touch gestures**: Registra listeners `touchstart`/`touchend`
   - Swipe derecha (>100px, desde borde izquierdo <50px): abre sidebar
   - Swipe izquierda (<-100px): cierra sidebar
7. **Cleanup**: Remueve touch event listeners

### 2. Debounce de busqueda - `[search]`

```typescript
const timer = setTimeout(() => setDebouncedSearch(search), 1000);
return () => clearTimeout(timer);
```

### 3. Sugerencias - `[search]`

```typescript
// Debounce de 300ms (mas rapido que la busqueda)
if (search.length < 2) return setSuggestions([]);
fetch(`/api/suggestions?q=${search}`) -> setSuggestions(data);
```

### 4. Persistencia de favoritos - `[pinnedStations, isBrowser]`

```typescript
if (isBrowser) {
  const ids = pinnedStations.map(s => s.id_ss);
  localStorage.setItem('fuelwatch_pins', JSON.stringify(ids));
}
```

### 5. Persistencia de otros estados

Cada uno guarda en localStorage cuando cambia (solo si `isBrowser`):
- `[debouncedSearch]` -> `fuelwatch_last_search`
- `[activeFilters]` -> `fuelwatch_active_filters` (JSON)
- `[selectedBrands]` -> `fuelwatch_selected_brands` (JSON)
- `[sortBy]` -> `fuelwatch_sort_by`

### 6. Fetch de datos - `[debouncedSearch]`

Cuando cambia `debouncedSearch`, llama `fetchData(true)` (reset page).

## Funciones

### toggleTheme()

Alterna entre light/dark. Guarda en localStorage. Agrega/quita clase `astro-dark` en `<html>`.

### onToggleFilter(f)

Toggle filtro de combustible. **No permite quitar todos**: si solo queda 1, no lo quita.

```typescript
if (prev.includes(f)) return prev.length > 1 ? prev.filter(x => x !== f) : prev;
return [...prev, f];
```

### handleSubmitSearch()

Ejecuta busqueda inmediata (sin esperar debounce). En mobile, cierra sidebar.

### fetchData(resetPage)

1. Si `!debouncedSearch`, return
2. Fetch paralelo: `/api/search` + `/api/stats`
3. Si `resetPage`:
   - Reemplaza estaciones, resetea a page 2
   - Actualiza `tempPriceRange` basado en stats (min*0.9, max*1.1)
4. Si no resetPage (load more):
   - Concatena estaciones, incrementa page
5. Actualiza `stats`, `totalCount`, `hasMore`

### togglePin(station)

```typescript
// Si ya esta pinned -> quitar
// Si hay 5 favoritos -> no hacer nada (maximo 5)
// Sino -> agregar al inicio
```

## Valores Computados (useMemo)

### sortedPinnedStations

Favoritos ordenados por precio **descendente** (mas caro primero). Usa el precio minimo de los filtros activos:
- Si diesel activo: `precio_diesel`
- Si gasolina activo: `precio_gasolina_95`
- Min de los precios validos (> 0)

### availableBrands

Set unico de `rotulo` de todas las estaciones (search + pinned), ordenado A-Z.

### filteredResults

1. Excluye estaciones que estan en favoritos
2. Filtra por marcas seleccionadas (si hay)
3. Filtra por precio maximo (`tempPriceRange.max`)
4. Ordena segun `sortBy`:
   - `brand_asc`: `localeCompare` por rotulo
   - `cp_asc`: `localeCompare` por codigo postal
   - `price_asc` / `price_desc`: por precio minimo de filtros activos

## Renderizado

### Layout principal

```
div.h-screen.flex.flex-col.desk:flex-row
├── Overlay (mobile, cuando sidebar abierta)
│   div.fixed.inset-0.z-[100].desk:hidden.bg-secondary/20.backdrop-blur-sm
├── Sidebar
│   aside.fixed.desk:relative.z-[110].h-screen.bg-secondary
│   ├── Header: "FUEL WATCH" + close button (mobile)
│   ├── FilterForm (scrollable)
│   └── Theme toggle button
├── Main content
│   div.flex-1.flex-col.h-screen.overflow-hidden
│   ├── Header bar
│   │   ├── Menu button
│   │   ├── "FUEL WATCH"
│   │   └── Theme toggle (desktop only)
│   └── Scrollable content
│       ├── Favoritos section (si hay)
│       │   ├── Titulo "FAVORITOS"
│       │   └── StationCard[] (pinned, sorted by price desc)
│       ├── Results header
│       │   ├── "Estaciones en {search}" (con marcas si filtradas)
│       │   └── "N RESULTADOS"
│       ├── Empty state (si no hay resultados)
│       ├── StationCard[] grid
│       ├── Loading spinner
│       └── "Cargar mas resultados" button
```

### Sidebar clases condicionales

```
Abierta: translate-x-0 w-80 p-6
Cerrada: -translate-x-full desk:translate-x-0 desk:w-0 overflow-hidden p-0
```

## Subcomponente: FilterForm

Ver spec dedicada: [filter-form.md](./filter-form.md)

## Imports

```typescript
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Fuel as FuelIcon, Droplets, ChevronDown, Check, Menu, X, Sun, Moon } from 'lucide-react';
import StationCard from './StationCard';
```

## localStorage Keys

| Key | Formato | Contenido |
|-----|---------|-----------|
| `fuelwatch_pins` | JSON array | Array de IDs numericos `[1234, 5678]` |
| `fuelwatch_last_search` | string | Nombre de localidad `"Madrid"` |
| `fuelwatch_active_filters` | JSON array | `["diesel", "gasolina"]` |
| `fuelwatch_selected_brands` | JSON array | `["REPSOL", "CEPSA"]` |
| `fuelwatch_sort_by` | string | `"price_asc"` |
| `fuelwatch_theme` | string | `"light"` o `"dark"` |
