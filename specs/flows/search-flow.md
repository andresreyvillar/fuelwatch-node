# Flow: Search

## Flujo completo de busqueda de estaciones

### Diagrama de secuencia

```
Usuario          FilterForm         FuelApp           API              Supabase
  │                  │                 │                │                  │
  ├─ escribe ──────> │                 │                │                  │
  │                  ├─ setSearch ───> │                │                  │
  │                  │                 │                │                  │
  │                  │      (300ms debounce)            │                  │
  │                  │                 ├─ GET /api/suggestions?q=... ───> │
  │                  │                 │                │ ── query ──────> │
  │                  │                 │ <── suggestions ──────────────── │
  │                  │ <── dropdown ── │                │                  │
  │                  │                 │                │                  │
  │ (click sugerencia o Enter)        │                │                  │
  │                  ├─ debouncedSearch │               │                  │
  │                  │                 │                │                  │
  │                  │     (o espera 1000ms debounce)   │                  │
  │                  │                 │                │                  │
  │                  │                 ├─ fetchData(true)                  │
  │                  │                 │  ┌─ GET /api/search?target=...&page=1&limit=50
  │                  │                 │  └─ GET /api/stats?location=...   │
  │                  │                 │                │                  │
  │                  │                 │                ├── searchStations()
  │                  │                 │                │   ├─ getSearchConditions()
  │                  │                 │                │   ├─ query servicestations
  │                  │                 │                │   └─ attachTrends()
  │                  │                 │                │       └─ query price_history (3 dias)
  │                  │                 │                │                  │
  │                  │                 │                ├── getStats()     │
  │                  │                 │                │   └─ query servicestations (aggregates)
  │                  │                 │                │                  │
  │                  │                 │ <── { data, meta } + stats ───── │
  │                  │                 │                │                  │
  │                  │                 ├─ setStations(data)               │
  │                  │                 ├─ setStats(stats)                 │
  │                  │                 ├─ setPriceTempRange(auto)         │
  │                  │                 ├─ setPage(2)                     │
  │                  │                 ├─ setHasMore(page < lastPage)    │
  │                  │                 │                │                  │
  │ <── render cards ─────────────── │                │                  │
  │                  │                 │                │                  │
  │ (click "Cargar mas")             │                │                  │
  │                  │                 ├─ fetchData(false)                │
  │                  │                 │  └─ GET /api/search?page=2&limit=50
  │                  │                 │ <── { data, meta } ──────────── │
  │                  │                 ├─ setStations(prev + newData)    │
  │                  │                 ├─ setPage(3)                     │
```

### Pasos detallados

1. **Usuario escribe** en el input de busqueda
   - `setSearch(value)` actualiza el estado inmediatamente
   - El input muestra el texto en tiempo real

2. **Sugerencias** (debounce 300ms)
   - Si `search.length >= 2`, fetch a `/api/suggestions?q={search}`
   - Se muestra dropdown con hasta 10 sugerencias
   - Si `search.length < 2`, se limpia el dropdown

3. **Trigger de busqueda** (una de estas opciones):
   - **Click en sugerencia**: `setSearch(s)` + `handleSubmitSearch()` inmediato
   - **Enter en input**: `handleSubmitSearch()` inmediato
   - **Debounce**: Tras 1000ms sin escribir, `setDebouncedSearch(search)`

4. **fetchData(true)** se ejecuta cuando cambia `debouncedSearch`
   - Fetch paralelo: `/api/search` + `/api/stats`
   - Search usa `page=1`, `limit=50`
   - Stats calcula min/max/avg de la zona

5. **Actualizar estado**:
   - `stations` = datos nuevos
   - `stats` = estadisticas nuevas
   - `tempPriceRange` = auto-calculado desde stats (min*0.9 a max*1.1)
   - `page` = 2 (listo para el siguiente "load more")
   - `hasMore` = si hay mas paginas

6. **Render**: Las tarjetas se renderizan con animacion cascade

7. **Load more**: Click en boton -> `fetchData(false)` -> concatena resultados

### Estado que cambia

| Paso | Estado modificado |
|------|-------------------|
| Escribir | `search` |
| Sugerencias | `suggestions` |
| Submit | `debouncedSearch` |
| Fetch | `loading` = true |
| Resultado | `stations`, `stats`, `page`, `hasMore`, `totalCount`, `tempPriceRange`, `loading` = false |
| Load more | `stations` (concat), `page` (+1), `hasMore` |

### Persistencia

- `debouncedSearch` se guarda en `fuelwatch_last_search`
- Al recargar la pagina, se restaura y ejecuta busqueda automaticamente

### Filtrado y ordenacion (client-side)

Despues de recibir los datos, `filteredResults` (useMemo) aplica:
1. Excluir estaciones en favoritos
2. Filtrar por marcas seleccionadas
3. Filtrar por precio maximo
4. Ordenar segun `sortBy`

Estos filtros son **client-side** sobre los datos ya cargados. No hacen nuevas peticiones al API.
