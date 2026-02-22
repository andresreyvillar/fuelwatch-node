# Service: Fuel Service

## Archivo: `src/lib/fuel.ts`

## Proposito

Modulo principal de logica de negocio. Contiene todas las funciones para buscar estaciones, obtener historico, calcular estadisticas y sincronizar datos del Ministerio.

## Funciones Exportadas

### updateDataFromMinistry()

```typescript
export async function updateDataFromMinistry(): Promise<{ success: boolean; count: number }>
```

**Logica**:
1. Fetch a `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/`
2. Extrae `data.ListaEESSPrecio`
3. Para cada estacion:
   - `parseInt(eess['IDEESS'])` -> `id_ss`
   - `parsePrice(eess['Precio Gasoleo A'])` -> `precio_diesel`
   - `parsePrice(eess['Precio Gasoleo Premium'])` -> `precio_diesel_extra`
   - `parsePrice(eess['Precio Gasolina 95 E5'])` -> `precio_gasolina_95`
   - `parsePrice(eess['Precio Gasolina 98 E5'])` -> `precio_gasolina_98`
   - Resto de campos: Rotulo, Horario, Direccion, Provincia, Localidad, C.P., coordenadas
   - `fecha_actualizacion`: `new Date().toISOString()`
4. Crea registro `price_history` si al menos 1 precio > 0 (precios = 0 se guardan como null)
5. Upsert a `servicestations` en batches de 1000 (ON CONFLICT id_ss)
6. Upsert a `price_history` en batches de 1000 (ON CONFLICT station_id, fecha)

**parsePrice** (funcion local):
```typescript
const parsePrice = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.'));
};
```

---

### getStationHistory(id)

```typescript
export async function getStationHistory(id: number): Promise<HistoryEntry[]>
```

**Query**:
```
FROM price_history
SELECT fecha, diesel, gas95, diesel_extra, gas98
WHERE station_id = {id}
ORDER BY fecha ASC
LIMIT 30
```

---

### getStationsByIds(ids)

```typescript
export async function getStationsByIds(ids: number[]): Promise<{ data: Station[] }>
```

**Logica**:
1. Query: `FROM servicestations SELECT * WHERE id_ss IN ({ids})`
2. `attachTrends(data)` para adjuntar tendencias de 3 dias
3. Return `{ data: withTrends }`

---

### searchStations(query, page, limit)

```typescript
export async function searchStations(
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<SearchResult>
```

**Logica**:
1. `skip = (page - 1) * limit`
2. `orConditions = getSearchConditions(query)`
3. Query:
   ```
   FROM servicestations
   SELECT *, count: exact
   WHERE .or(orConditions)
   ORDER BY cp ASC
   RANGE(skip, skip + limit - 1)
   ```
4. `attachTrends(data)`
5. Return:
   ```typescript
   {
     data: withTrends,
     meta: {
       total: count || 0,
       page,
       lastPage: Math.ceil((count || 0) / limit)
     }
   }
   ```

---

### getStats(location)

```typescript
export async function getStats(location: string): Promise<Stats | null>
```

**Logica**:
1. `orConditions = getSearchConditions(location)`
2. Query:
   ```
   FROM servicestations
   SELECT precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98
   WHERE .or(orConditions)
   ```
3. Filtra precios > 0 para diesel y gas95
4. Calcula `min`, `max`, `avg` para cada tipo
5. Return `null` si no hay datos

**Nota**: Solo retorna stats de `diesel` y `gas95`, no de `diesel_extra` ni `gas98`.

---

## Funciones Internas

### checkSupabase()

```typescript
function checkSupabase(): SupabaseClient
```

Valida que el cliente Supabase este inicializado. Lanza error si no.

---

### attachTrends(data)

```typescript
async function attachTrends(data: Station[]): Promise<Station[]>
```

**Proposito**: Adjunta los precios de hace 3 dias a cada estacion para calcular la tendencia.

**Logica**:
1. Calcula fecha de hace 3 dias: `new Date() - 3 dias` -> `YYYY-MM-DD`
2. Extrae IDs de estaciones: `data.map(s => s.id_ss)`
3. Query:
   ```
   FROM price_history
   SELECT station_id, fecha, diesel, diesel_extra, gas95, gas98
   WHERE station_id IN ({ids})
     AND fecha <= {3_dias_atras}
   ORDER BY fecha DESC
   LIMIT {stationIds.length}
   ```
4. Agrupa por station_id, toma solo el primer resultado (mas reciente <= 3 dias)
5. Adjunta como `station.trend` a cada estacion

**Nota sobre el LIMIT**: El limite es `stationIds.length` (1 registro por estacion). Si una estacion no tiene datos de hace 3+ dias, no tendra trend.

---

### getSearchConditions(query)

Ver spec dedicada: [search-conditions.md](./search-conditions.md)

## Dependencias

- `supabase` de `./supabase.ts`
