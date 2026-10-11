## ADDED Requirements

### Requirement: Histórico de los últimos 30 días
El sistema DEBE devolver, para una estación, sus precios diarios con fecha entre hoy − 29 días y hoy (UTC),
ordenados por fecha ascendente, sin completar los días que falten con días más antiguos.

#### Scenario: historico-ultimos-30-dias
**WHEN** se pide el histórico de una estación con precios diarios de más de 30 días
**THEN** responde 200 con los precios diarios de los últimos 30 días (desde hoy − 29 hasta hoy), ordenados de más antiguo a más reciente

#### Scenario: historico-con-huecos-no-se-rellena
**WHEN** dentro de los últimos 30 días faltan algunos días y la estación tiene precios más antiguos
**THEN** responde solo con los días de la ventana que existen, sin incluir ningún día anterior a hoy − 29

#### Scenario: historico-sin-datos-recientes
**WHEN** la estación solo tiene precios diarios anteriores a hoy − 29
**THEN** responde 200 con una lista vacía

verified-by:
  - frontend_astro/tests/historico-ultimos-30-dias/history.test.ts::historico-ultimos-30-dias
  - frontend_astro/tests/historico-ultimos-30-dias/history.test.ts::historico-con-huecos-no-se-rellena
  - frontend_astro/tests/historico-ultimos-30-dias/history.test.ts::historico-sin-datos-recientes
