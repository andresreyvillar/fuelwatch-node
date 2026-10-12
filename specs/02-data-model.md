# 02 - Modelo de Datos

## Tablas Supabase

### servicestations

Tabla principal con los datos actuales de cada estacion de servicio.

```sql
CREATE TABLE servicestations (
  id_ss       BIGINT PRIMARY KEY,        -- ID unico del Ministerio (IDEESS)
  rotulo      TEXT,                       -- Marca/nombre (REPSOL, CEPSA, BP, BALLENOIL...)
  horario     TEXT,                       -- Horario operacion ("L-D: 24H", "L-V: 06:00-22:00")
  precio_diesel       NUMERIC,           -- Precio Gasoleo A (EUR/litro, 3 decimales)
  precio_diesel_extra NUMERIC,           -- Precio Gasoleo Premium
  precio_gasolina_95  NUMERIC,           -- Precio Gasolina 95 E5
  precio_gasolina_98  NUMERIC,           -- Precio Gasolina 98 E5
  direccion   TEXT,                       -- Direccion completa
  provincia   TEXT,                       -- Provincia
  localidad   TEXT,                       -- Localidad/ciudad
  cp          TEXT,                       -- Codigo postal
  longitud    DOUBLE PRECISION,           -- Longitud WGS84 (NULL si el Ministerio no la da)
  latitud     DOUBLE PRECISION,           -- Latitud WGS84 (NULL si el Ministerio no la da)
  fecha_actualizacion TIMESTAMP           -- Ultima actualizacion (ISO 8601)
);

-- Conflict key para upsert:
-- ON CONFLICT (id_ss) DO UPDATE
```

### price_history

Historial diario de precios por estacion. Se actualiza cada hora pero la clave compuesta `(station_id, fecha)` hace upsert, asi que solo se guarda el ultimo precio del dia.

```sql
CREATE TABLE price_history (
  station_id   BIGINT REFERENCES servicestations(id_ss),
  fecha        DATE,                      -- Fecha del registro (YYYY-MM-DD)
  diesel       NUMERIC,                   -- Precio diesel (null si no disponible)
  diesel_extra NUMERIC,                   -- Precio diesel premium
  gas95        NUMERIC,                   -- Precio gasolina 95
  gas98        NUMERIC,                   -- Precio gasolina 98
  PRIMARY KEY (station_id, fecha)
);

-- Conflict key para upsert:
-- ON CONFLICT (station_id, fecha) DO UPDATE
```

## Tipos TypeScript (Frontend)

### Station (respuesta de /api/search)

```typescript
interface Station {
  id_ss: number;
  rotulo: string;
  horario: string;
  precio_diesel: number;
  precio_diesel_extra: number;
  precio_gasolina_95: number;
  precio_gasolina_98: number;
  direccion: string;
  provincia: string;
  localidad: string;
  cp: string;
  longitud: number | null;
  latitud: number | null;
  fecha_actualizacion: string;
  trend: TrendData | null;  // Adjuntado por attachTrends()
}
```

### TrendData (precios de hace 3 dias para comparacion)

```typescript
interface TrendData {
  station_id: number;
  fecha: string;
  diesel: number | null;
  diesel_extra: number | null;
  gas95: number | null;
  gas98: number | null;
}
```

### Stats (respuesta de /api/stats)

```typescript
type FuelStats = { min: number; max: number; avg: number };

// Solo aparecen los carburantes con algún precio > 0 en la localidad
type Stats = Partial<Record<'diesel' | 'diesel_extra' | 'gas95' | 'gas98', FuelStats>>;
```

### HistoryEntry (respuesta de /api/history)

```typescript
interface HistoryEntry {
  fecha: string;       // "YYYY-MM-DD"
  diesel: number | null;
  diesel_extra: number | null;
  gas95: number | null;
  gas98: number | null;
}
```

### SearchResult (respuesta completa de /api/search)

```typescript
interface SearchResult {
  data: Station[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
```

## Mapeo Ministry API -> Supabase

| Campo Ministry API | Campo Supabase |
|---|---|
| `IDEESS` | `id_ss` (parseInt) |
| `Rotulo` | `rotulo` |
| `Horario` | `horario` |
| `Precio Gasoleo A` | `precio_diesel` (parsePrice) |
| `Precio Gasoleo Premium` | `precio_diesel_extra` (parsePrice) |
| `Precio Gasolina 95 E5` | `precio_gasolina_95` (parsePrice) |
| `Precio Gasolina 98 E5` | `precio_gasolina_98` (parsePrice) |
| `Direccion` | `direccion` |
| `Provincia` | `provincia` |
| `Localidad` | `localidad` |
| `C.P.` | `cp` |
| `Longitud (WGS84)` | `longitud` (parseCoordinate) |
| `Latitud` | `latitud` (parseCoordinate) |

### parsePrice

Funcion para convertir precios del Ministerio (formato espanol con coma) a numeros:

```
Input:  "1,339" -> Output: 1.339
Input:  ""      -> Output: 0
Input:  null    -> Output: 0
```

Logica: `parseFloat(value.replace(',', '.'))` o `0` si vacio/null.

### parseCoordinate

Convierte una coordenada del Ministerio a numero; a diferencia de los precios, lo que no es un numero es `null` (nunca `0`, que seria un punto real del mapa):

```
Input:  "42,240611" -> Output: 42.240611
Input:  "-8,720278" -> Output: -8.720278
Input:  ""          -> Output: null
Input:  "sin dato"  -> Output: null
```

Logica: `trim(value).replace(',', '.')`; si casa con `^-?\d+(\.\d+)?$` (la misma regla que la migracion SQL), `Number()` de ese texto; si no (vacio, solo espacios, `0x10`, `1e3`...), `null`. Esta en `scripts/sync-prices.mjs` (exportada) y en `lib/fuel.ts`.

**Migracion:** las columnas eran texto con coma decimal. `supabase/coordenadas-numericas.sql` las convierte a `double precision` y crea el indice `(latitud, longitud)`; se ejecuta a mano en el editor SQL de Supabase despues de desplegar el parseo.

## Mapeo de claves entre servicestations y price_history

Las claves de precio tienen nombres distintos en cada tabla:

| servicestations | price_history | Label UI |
|---|---|---|
| `precio_diesel` | `diesel` | Diesel |
| `precio_diesel_extra` | `diesel_extra` | Extra |
| `precio_gasolina_95` | `gas95` | 95 |
| `precio_gasolina_98` | `gas98` | 98 |
