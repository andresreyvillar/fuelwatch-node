# Flow: Favorites (Favoritos)

## Flujo de gestion de estaciones favoritas

### Diagrama

```
Usuario          StationCard        FuelApp           API              localStorage
  │                  │                 │                │                  │
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║ CARGA INICIAL (mount)                                                ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  │                  │                 │                │                  │
  │                  │                 ├─ read fuelwatch_pins ──────────> │
  │                  │                 │ <── [1234, 5678] (IDs) ──────── │
  │                  │                 │                │                  │
  │                  │                 ├─ GET /api/search?ids=1234,5678&t=...
  │                  │                 │                │                  │
  │                  │                 │ <── { data: [station1, station2] }
  │                  │                 │                │                  │
  │                  │                 ├─ setPinnedStations([s1, s2])    │
  │                  │                 │                │                  │
  │ <── render favoritos section ──── │                │                  │
  │                  │                 │                │                  │
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║ AGREGAR FAVORITO                                                     ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  │                  │                 │                │                  │
  │ ── click pin ──> │                 │                │                  │
  │                  ├─ onTogglePin(station) ─────────> │                  │
  │                  │                 │                │                  │
  │                  │                 ├─ togglePin(station)              │
  │                  │                 │  if not pinned && pins < 5:      │
  │                  │                 │    pinnedStations = [station, ...prev]
  │                  │                 │                │                  │
  │                  │                 ├─ save IDs ─────────────────────> │
  │                  │                 │  fuelwatch_pins = [id, ...prevIds]
  │                  │                 │                │                  │
  │ <── re-render (card con estilo pinned) ────────── │                  │
  │                  │                 │                │                  │
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║ QUITAR FAVORITO                                                      ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  │                  │                 │                │                  │
  │ ── click unpin ─> │                │                │                  │
  │                  ├─ onTogglePin(station) ─────────> │                  │
  │                  │                 │                │                  │
  │                  │                 ├─ togglePin(station)              │
  │                  │                 │  if already pinned:              │
  │                  │                 │    pinnedStations = prev.filter(!=id)
  │                  │                 │                │                  │
  │                  │                 ├─ save IDs ─────────────────────> │
  │                  │                 │  fuelwatch_pins = [...remainingIds]
  │                  │                 │                │                  │
  │ <── re-render (card vuelve a resultados) ──────── │                  │
```

### Reglas de negocio

1. **Maximo 5 favoritos**: Si ya hay 5, no se puede agregar mas (silencioso, sin error)
2. **Datos frescos**: Al cargar la pagina, siempre se hace fetch fresco por IDs (no se usan datos cached)
   - Se agrega `&t={Date.now()}` como cache buster
3. **Solo IDs en localStorage**: Se guardan solo los `id_ss`, no los objetos completos
   - Compatibilidad: Si hay formato legacy (objetos), se extraen los IDs
4. **Ordenacion de favoritos**: `sortedPinnedStations` ordena por precio descendente (mas caro primero)
   - Precio = min de precios validos segun filtros activos
   - Sin precio valido = `-Infinity` (va al final)
5. **Exclusion de resultados**: Las estaciones pinned no aparecen en la lista de resultados

### Persistencia

| Key | Formato | Ejemplo |
|-----|---------|---------|
| `fuelwatch_pins` | JSON array de numeros | `[12345, 67890, 11111]` |

### Formato legacy (backward compatible)

El codigo soporta el formato anterior donde se guardaban objetos completos:
```typescript
const parsed = JSON.parse(savedPins);
pinIds = parsed.map((p: any) =>
  (typeof p === 'object' && p !== null && 'id_ss' in p) ? p.id_ss : p
);
```

### Visualizacion

- **Seccion "FAVORITOS"**: Solo se muestra si hay al menos 1 favorito
  - Titulo: text-[10px] font-black text-primary uppercase tracking-[0.3em]
  - Linea decorativa: `span.w-8.h-px.bg-primary/20` antes del texto
- **StationCard pinned**: `isPinned=true`
  - Fondo: `bg-primary/5 border-primary/20 shadow-inner`
  - Boton pin: Lock icon, `text-primary bg-primary/10`
- **StationCard normal**: `isPinned=false`
  - Fondo: `bg-white border-gray-100`
  - Boton pin: LockKeyholeOpen icon, `text-gray-300`

### Botones de pin

| Contexto | Icono | Ubicacion |
|----------|-------|-----------|
| Mobile, pinned | Lock (16px) | Absolute top-3 right-3 |
| Mobile, normal | LockKeyholeOpen (16px) | Absolute top-3 right-3 |
| Desktop, pinned | Lock (20px) | Action row (derecha) |
| Desktop, normal | LockKeyholeOpen (20px) | Action row (derecha) |
