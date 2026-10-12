# ruta

## Purpose

Por definir.

## Requirements

### Requirement: Gasolineras en el corredor de una ruta
El sistema DEBE devolver, para un origen, un destino, un desvío máximo y un carburante, la ruta por carretera
y las estaciones con precio mayor que 0 de ese carburante a una distancia en línea recta de la ruta menor o
igual que el desvío, con su km de ruta y su desvío, ordenadas por km de ruta.

#### Scenario: ruta-gasolineras-en-el-corredor
**WHEN** se pide la ruta entre dos puntos con un desvío máximo
**THEN** la respuesta incluye las estaciones a esa distancia o menos de la ruta, con su `desvioKm`, y ninguna más lejana

#### Scenario: ruta-ordenada-por-km
**WHEN** hay varias estaciones en el corredor
**THEN** salen ordenadas por el km de la ruta en el que quedan (`kmRuta`), desde el origen

#### Scenario: ruta-sin-precio-excluida
**WHEN** una estación del corredor no tiene precio del carburante elegido (precio 0)
**THEN** no aparece en la respuesta

verified-by:
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-gasolineras-en-el-corredor
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-ordenada-por-km
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-sin-precio-excluida

### Requirement: La más barata de cada tramo de 100 km
El sistema DEBE marcar, en cada tramo de 100 km de la ruta, la estación del corredor con el precio más bajo del
carburante elegido.

#### Scenario: ruta-mas-barata-por-tramo
**WHEN** el corredor tiene estaciones en distintos tramos de 100 km de la ruta
**THEN** en cada tramo la estación con el precio más bajo del carburante elegido lleva `masBarataDelTramo: true` y las demás `false`

verified-by:
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-mas-barata-por-tramo

### Requirement: Errores de la búsqueda por ruta
El sistema DEBE responder 400 ante parámetros inválidos, 404 si no hay ruta por carretera y 502 si el servicio
de rutas falla.

#### Scenario: ruta-parametros-no-validos
**WHEN** falta el origen o el destino, no son coordenadas decimales dentro de España (con Canarias, Ceuta y Melilla), el desvío no es exactamente 1, 2, 5 o 10, o el carburante no es `diesel` ni `gas95`
**THEN** responde 400 con `{ "error": "Invalid <parámetro>" }` (`from`, `to`, `radius` o `fuel`)

#### Scenario: ruta-sin-ruta
**WHEN** el servicio de rutas no encuentra ruta por carretera entre los dos puntos: no hay ruta, tiene que mover algún extremo más de 5 km para llegar a una carretera, la ruta incluye un tramo en ferry o supera 1.600 km
**THEN** responde 404 con `{ "error": "No route" }`

#### Scenario: ruta-servicio-no-disponible
**WHEN** el servicio de rutas no responde en 10 s, responde con error o sin geometría
**THEN** responde 502 con `{ "error": "Routing unavailable" }`

verified-by:
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-parametros-no-validos
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-sin-ruta
  - frontend_astro/tests/ruta-gasolineras/route-stations.test.ts::ruta-servicio-no-disponible

### Requirement: Orden de la lista de la ruta
La app DEBE permitir ordenar las gasolineras de la ruta por km de ruta (por defecto) o por precio del carburante
elegido, de menor a mayor; a igual precio, primero la que antes se encuentra en la ruta.

#### Scenario: ruta-ordenada-por-precio
**WHEN** el conductor elige ordenar la lista de la ruta por precio
**THEN** las gasolineras van del precio más bajo al más alto del carburante elegido y, a igual precio, por km de ruta; al volver a «Por km de ruta» recuperan el orden del viaje

verified-by:
  - frontend_astro/tests/ruta-orden-y-distancia/route-list.test.ts::ruta-ordenada-por-precio

### Requirement: Distancia desde el origen
La app DEBE indicar, para cada gasolinera de la ruta, a cuántos km del origen está por la ruta y a cuántos km de
la carretera.

#### Scenario: ruta-distancia-desde-origen
**WHEN** se muestra una gasolinera de la ruta
**THEN** su etiqueta dice «A {km de ruta redondeado} km del origen · a {desvío con un decimal y coma} km de la carretera»

verified-by:
  - frontend_astro/tests/ruta-orden-y-distancia/route-list.test.ts::ruta-distancia-desde-origen
