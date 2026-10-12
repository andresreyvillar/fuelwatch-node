## ADDED Requirements

### Requirement: Dirección enlazada a Google Maps
La app DEBE convertir la dirección de cada estación en un enlace que abre Google Maps en una pestaña nueva, con la
latitud y longitud de la estación si están dentro de España, o con su dirección, localidad y provincia si no.

#### Scenario: direccion-abre-google-maps
**WHEN** el conductor pulsa la dirección de una gasolinera con coordenadas dentro de España
**THEN** se abre Google Maps, en una pestaña nueva (en el móvil, la app si está instalada), centrado en la latitud y longitud de la estación

#### Scenario: direccion-sin-coordenadas-busca-por-direccion
**WHEN** la gasolinera no tiene coordenadas válidas (vacías, `0,0` o fuera de España)
**THEN** Google Maps busca su dirección, localidad y provincia

verified-by:
  - frontend_astro/tests/direccion-en-google-maps/maps.test.ts::direccion-abre-google-maps
  - frontend_astro/tests/direccion-en-google-maps/maps.test.ts::direccion-sin-coordenadas-busca-por-direccion
