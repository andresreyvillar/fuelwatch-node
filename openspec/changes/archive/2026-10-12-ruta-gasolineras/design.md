# Design — ruta-gasolineras

## Problema

El conductor quiere elegir un origen y un destino y ver las gasolineras que quedan a menos de X km de la
carretera, en el orden en que se las encuentra, para decidir dónde parar a repostar. Datos medidos el
2026-10-12: Vigo → Madrid son 591 km; la geometría completa de OSRM tiene 6.970 puntos (161 KB) y la
«simplificada» 56, demasiado gruesa para un corredor de 1 km.

## Decisión

**Geocodificación en el navegador, ruta y corredor en el servidor.**

```
Navegador (pestaña «Ruta»)                         Servidor (Cloudflare)                 Externos
──────────────────────────                         ─────────────────────                 ────────
origen/destino ──(autocompletado)──────────────────────────────────────────────────────▶ Photon (bbox España)
[lon,lat] x2 + radio + carburante ──▶ GET /api/route-stations
                                       1. ruta completa ─────────────────────────────────▶ OSRM /route (overview=full)
                                       2. corta la ruta en tramos (≤ 30 tramos)
                                       3. por tramo, caja = tramo + radio ──────────────▶ Supabase (latitud/longitud
                                          (con precio > 0 del carburante)                   entre…, índice nuevo)
                                       4. distancia de cada estación a la ruta y km
                                          de ruta donde queda; descarta > radio
                                       5. ordena por km; marca la más barata
                                          de cada tramo de 100 km
                                       6. ruta simplificada para dibujar
mapa (Leaflet + OpenStreetMap) ◀────── { route, stations }
y lista por km de ruta
```

- **Por qué el corredor en el servidor:** se prueba con tests de endpoint (OSRM y Supabase falsos, como en
  los slices anteriores), la geometría completa no viaja al navegador y Supabase solo devuelve las estaciones
  de las cajas de cada tramo (gracias al índice `(latitud, longitud)` de `coordenadas-numericas`).
- **Por qué la geocodificación en el navegador:** es autocompletado (una petición por tecla con debounce);
  pasarla por el servidor solo añade latencia. Photon admite CORS y no usa clave.
- **Distancias:** proyección equirectangular local (error < 0,5 % a escala de 10 km) y distancia punto-segmento.
  Es la distancia en línea recta a la carretera, no el desvío real por carretera (decisión del humano).
- **Tramos:** `max(25 km, longitud / 30)`, para no pasar de 30 consultas a Supabase más 1 a OSRM por petición
  (Cloudflare Workers del plan gratuito permite 50 subpeticiones).
- **Carburante:** el de orden de la búsqueda por provincia (`provinceSortFuel(activeFilters)`): Diésel →
  Gasóleo A, solo Gasolina → Gasolina 95. Las estaciones sin precio de ese carburante no aparecen.
- **Mapa:** `leaflet` 1.9.4 + `react-leaflet` 5.0.0 (peer `react` ^19, compatible con React 19.2) +
  `@types/leaflet` 1.9.22, cargados solo al abrir la pestaña (`React.lazy`) porque Leaflet necesita `window`.
  Teselas de OpenStreetMap con su atribución.

## Alternativas descartadas

1. **Google Maps (Directions + Maps JS).** Mejor calidad de rutas, pero exige cuenta de facturación y una clave;
   Cloudflare Pages no inyecta variables de entorno en el SSR de este proyecto (CLAUDE.md), así que la clave
   acabaría en el código o en el navegador. El humano eligió la opción sin claves.
2. **Filtrar en el navegador.** Descargar las ~12.500 estaciones (≈ 1,5 MB) en cada ruta y calcular allí:
   sin migración, pero lento en móvil y sin tests de endpoint.
3. **PostGIS (`ST_DWithin` sobre la línea de la ruta).** La consulta exacta en la base de datos, pero exige
   extensión, columna `geography`, función RPC y otra migración manual. Cajas por tramo + cálculo en el servidor
   bastan para ~12.500 estaciones.

## Riesgos

- **Coste por peticion (verificado):** la ruta solo se calcula entre puntos de Espana (400 fuera de la caja), cada
  estacion se mide solo contra su tramo con la linea proyectada una vez, la respuesta se cachea una hora y OSRM
  tiene un timeout de 10 s. Medido en local: 1-4 ms de CPU de calculo para Vigo → Madrid, ~18 ms en el peor caso
  (Cadiz → Girona, 10 km). El plan gratuito de Workers limita la CPU a 10 ms por peticion: vigilar en produccion.
- **OSRM engancha a la carretera mas cercana:** un destino sin carretera (Canarias desde la Peninsula) no da
  `NoRoute` sino una ruta hasta otro sitio; se responde 404 si algun extremo se mueve mas de 5 km.

- **OSRM público** (`router.project-osrm.org`) es un servidor de demostración con política de uso razonable y
  sin garantía de disponibilidad: si falla, el endpoint responde 502 y la pestaña lo explica. Cambiar a
  OpenRouteService (clave gratuita) sería un slice aparte.
- **Datos del Ministerio con coordenadas erróneas** (3 en `0,0` y 1 invertida el 2026-10-12): quedan fuera de
  cualquier caja de ruta en España; no se corrigen aquí.
- **Dependencias nuevas** (`leaflet`, `react-leaflet`, `@types/leaflet`): se instalan solo con permiso del humano.
- **Bloqueo:** el endpoint filtra por rango numérico; hasta que el humano ejecute
  `supabase/coordenadas-numericas.sql`, las columnas son texto y el filtro daría resultados erróneos. No se
  despliega antes de la migración.
