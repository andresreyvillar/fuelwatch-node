## ADDED Requirements

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
