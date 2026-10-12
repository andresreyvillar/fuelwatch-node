## MODIFIED Requirements

### Requirement: Orden de la lista de la ruta
La app DEBE permitir ordenar las gasolineras de la ruta por precio del carburante elegido (por defecto), de menor a
mayor y, a igual precio, primero la que antes se encuentra en la ruta; o por km de ruta.

#### Scenario: ruta-ordenada-por-precio
**WHEN** el conductor elige ordenar la lista de la ruta por precio
**THEN** las gasolineras van del precio más bajo al más alto del carburante elegido y, a igual precio, por km de ruta; al volver a «Por km de ruta» recuperan el orden del viaje

verified-by:
  - frontend_astro/tests/ruta-orden-y-distancia/route-list.test.ts::ruta-ordenada-por-precio
