# Component: FilterForm

## Archivo: `src/components/FuelApp.tsx` (definido inline antes de FuelApp)

## Proposito

Formulario de filtros que se muestra en el sidebar. Contiene busqueda, ordenacion, filtros de combustible, seleccion de marcas y rango de precios.

## Props

```typescript
interface FilterFormProps {
  isDark: boolean;              // Siempre true (sidebar tiene fondo oscuro)
  search: string;
  setSearch: (v: string) => void;
  activeFilters: string[];
  onToggleFilter: (f: string) => void;
  selectedBrands: string[];
  setSelectedBrands: (v: string[] | ((prev: string[]) => string[])) => void;
  isBrandDropdownOpen: boolean;
  setIsBrandDropdownOpen: (v: boolean) => void;
  availableBrands: string[];
  tempPriceRange: { min: number; max: number };
  setPriceTempRange: (v: any) => void;
  suggestions: string[];
  onSelectSuggestion: (s: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (v: boolean) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  onSearchSubmit: () => void;
}
```

**Nota**: Todas las props se pasan como `any` en el codigo actual.

## Estructura de Renderizado

### 1. Busqueda

```
div
├── Label: "BUSQUEDA" (10px, uppercase, tracking-[0.2em])
├── Input container (relative)
│   ├── Search icon (absolute left)
│   ├── Input text
│   │   placeholder: "Ciudad o CP..."
│   │   onFocus: setIsSearchFocused(true) + clear search
│   │   onBlur: setTimeout(() => setIsSearchFocused(false), 200)
│   │   onKeyDown Enter: onSearchSubmit()
│   │   classes: rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-primary
│   └── Suggestions dropdown (si focused && suggestions.length > 0)
│       div.absolute.z-[70].w-full.mt-2.rounded-2xl
│       └── {suggestions.map -> div.px-4.py-3 onClick: onSelectSuggestion}
```

### 2. Ordenar por

```
div
├── Label: "ORDENAR POR"
├── Select (appearance-none, rounded-2xl)
│   ├── option "Precio: mas barato" value="price_asc"
│   ├── option "Precio: mas caro" value="price_desc"
│   ├── option "Marca: A-Z" value="brand_asc"
│   └── option "Codigo Postal" value="cp_asc"
└── ChevronDown icon (absolute right, pointer-events-none)
```

### 3. Filtros de combustible

```
div.flex.p-2.rounded-2xl.border.gap-2 (bg-white/5)
├── Button "DIESEL"
│   onClick: onToggleFilter('diesel')
│   Active: bg-primary text-white shadow-md
│   Inactive: text-white/40
└── Button "GASOLINA"
    onClick: onToggleFilter('gasolina')
    (mismos estilos)
```

### 4. Selector de marcas

```
div.relative
├── Button trigger (w-full, rounded-2xl)
│   Text: "{n} Marcas" o "Todas las marcas"
│   ChevronDown (rotate-180 si abierto)
└── Dropdown (si isBrandDropdownOpen)
    div.absolute.z-50.max-h-60.overflow-y-auto.rounded-2xl
    ├── Button "Limpiar seleccion" (text-primary)
    └── {availableBrands.map -> div con checkbox}
        ├── Checkbox visual (w-4 h-4, bg-primary si selected)
        └── Brand name (text-sm)
        onClick: toggle brand en selectedBrands
```

### 5. Rango de precio maximo

```
div
├── Header flex
│   ├── Label "PRECIO MAX" (gray)
│   └── Value "{max.toFixed(2)}EUR" (text-primary)
└── Input range
    min=1, max=2.5, step=0.01
    value: tempPriceRange.max
    classes: accent-primary
```

## Estilos isDark

Todas las variantes de estilo usan `isDark` (siempre `true` porque el sidebar es oscuro):
- Backgrounds: `bg-white/10`, `bg-white/5`
- Borders: `border-white/10`, `border-white/5`
- Textos: `text-white`, `text-white/40`, `text-white/20`
- Labels: `text-white/40`

## Interacciones

| Accion | Resultado |
|--------|-----------|
| Focus en input | Limpia texto, muestra sugerencias |
| Blur en input | Oculta sugerencias (con 200ms delay) |
| Enter en input | Ejecuta busqueda inmediata |
| Click sugerencia | Selecciona, ejecuta busqueda, cierra dropdown |
| Click DIESEL/GASOLINA | Toggle filtro (min 1 activo) |
| Click marca en dropdown | Toggle seleccion de marca |
| "Limpiar seleccion" | Reset selectedBrands a [] |
| Slider precio | Actualiza tempPriceRange.max |
