---
slice: busqueda-por-provincia
status: shipped
kind: action
actor: conductor
trigger:
  type: ui
  surface: web
  detail: "elegir una provincia en las sugerencias del buscador"
events:
  emits: []
  consumes: []
specs:
  - sugerencias
  - busqueda-provincia
  - estadistica-zona
tests_root: frontend_astro/tests/busqueda-por-provincia
blocked: null
---

# El conductor busca las estaciones de toda una provincia, de la más barata a la más cara

**Actor:** conductor
**Trigger:** elige una provincia en las sugerencias del buscador. La app llama a
`GET /api/suggestions?q=`, `GET /api/search?province={provincia}&fuel={carburante}` y
`GET /api/stats?province={provincia}`.

## Contexto

Hoy solo se busca por localidad o código postal (`getSearchConditions()`), y el orden por precio se aplica
en el navegador sobre las páginas ya cargadas (50 por página) de una consulta ordenada por código postal:
«la más barata» es la más barata de lo cargado. En una provincia eso no sirve: MADRID tiene 914 estaciones
(medido en Supabase el 2026-10-11).

Datos medidos:
- `provincia` tiene 52 valores con la grafía del Ministerio: artículo pospuesto (`CORUÑA (A)`,
  `PALMAS (LAS)`, `RIOJA (LA)`, `BALEARS (ILLES)`), tildes (`MÁLAGA`, `ÁVILA`) y nombres bilingües
  (`VALENCIA / VALÈNCIA`, `ARABA/ÁLAVA`).
- Un carburante que la estación no vende se guarda como `0`, nunca `null`: 391 estaciones sin Gasóleo A y
  1158 sin Gasolina 95.

Decisiones del humano: las provincias aparecen en las mismas sugerencias que las localidades; se ordena
por el carburante del filtro (Diésel → Gasóleo A, Gasolina → Gasolina 95; con los dos activos, Gasóleo A);
las estaciones sin precio de ese carburante no aparecen.

Job story: `buscar-estaciones-por-localidad` (glosario: `localidad`, nuevo término `provincia`).

## Comportamiento observable

Sugerencias: `[{ "tipo": "localidad" | "provincia", "nombre": "<valor en BD>" }]`.
Búsqueda por provincia: `{ data: Station[], meta: { total, page, lastPage } }`, como la de localidad.

### sugerencias-incluyen-provincia
**WHEN** el conductor escribe al menos 2 caracteres que forman parte del nombre de una provincia
**THEN** las sugerencias incluyen esa provincia (`tipo: "provincia"`) además de las localidades que coinciden (`tipo: "localidad"`)

### sugerencia-provincia-sin-tildes-ni-articulo
**WHEN** el conductor escribe el nombre de una provincia sin tildes o con el artículo delante («malaga», «a coruna», «las palmas»)
**THEN** las sugerencias incluyen la provincia con su nombre exacto en la base de datos («MÁLAGA», «CORUÑA (A)», «PALMAS (LAS)»)

### provincia-ordenada-por-precio
**WHEN** se buscan las estaciones de una provincia por Gasóleo A
**THEN** responde solo estaciones de esa provincia, ordenadas por precio de Gasóleo A de menor a mayor (a igual precio, por id), paginadas, con el total de la provincia

### provincia-ordenada-por-gasolina-95
**WHEN** se buscan las estaciones de una provincia por Gasolina 95
**THEN** el orden es por precio de Gasolina 95 de menor a mayor

### provincia-excluye-sin-carburante
**WHEN** alguna estación de la provincia no tiene precio del carburante elegido (precio 0)
**THEN** no aparece en la respuesta ni cuenta en el total

### provincia-carburante-no-valido
**WHEN** se pide una búsqueda por provincia sin carburante o con uno distinto de `diesel` y `gas95`
**THEN** responde 400 con `{ "error": "Invalid fuel" }`

### estadistica-de-provincia
**WHEN** se pide la estadística de zona de una provincia
**THEN** se calcula con todas las estaciones de esa provincia (las mismas reglas de la estadística de zona) y no con las localidades cuyo nombre coincide

### orden-provincia-segun-filtros
**WHEN** el conductor busca por provincia con el filtro Diésel, con el filtro Gasolina o con los dos
**THEN** la app pide el orden por Gasóleo A, por Gasolina 95 y por Gasóleo A, respectivamente

## Estado después

Nada cambia en los datos: son lecturas. La app guarda la última búsqueda con su tipo, de modo que al
volver se repite la búsqueda por provincia.

## Edge cases

- Comportamiento que se conserva (regresión, sin `@scenarios`): la búsqueda por localidad
  (`?target=`) y la estadística por localidad (`?location=`) no cambian; con menos de 2 caracteres las
  sugerencias son `[]`; una provincia sin estaciones con precio responde `data: []` y `total: 0`.
- La lista de provincias es fija (52, la del Ministerio). Si el Ministerio renombrara una, dejaría de
  sugerirse hasta actualizar la lista.
- La interfaz (sugerencia marcada como provincia, orden en el navegador coherente con el del servidor) no
  tiene test automático: no hay jsdom ni Playwright instalados. Se comprueba a mano con `npm run dev`.

## Fuera de alcance

- Ordenar en el servidor por marca, por código postal o de mayor a menor en modo provincia: esos órdenes
  siguen aplicándose en el navegador sobre lo cargado, como hoy.
- Ordenar por el más barato de los dos carburantes: exige una vista o migración (decisión del humano).
- Rango del filtro de precio máximo con los cuatro carburantes: slice aparte ya anotado.
- Escapar comas en `getSearchConditions()`: hallazgo de seguridad previo, slice aparte.
