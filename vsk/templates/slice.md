---
slice: {{slug}}
status: proposed
kind: {{kind}}
actor: ?
trigger:
  type: ?          # ui | http | event | cron | command
  surface: ?       # una de stack.surfaces para ui/http
  detail: ?
events:
  emits: []
  consumes: []
specs:
  - {{capability}}
tests_root: ?
blocked: null
---

# Título en presente: lo que pasa, no cómo se hace

**Actor:** ?
**Trigger:** ?

## Contexto

Por qué existe este comportamiento. Datos medidos antes que opiniones; lo no verificado se marca `?`.

## Comportamiento observable

### primer-escenario
**WHEN** condición observable
**THEN** resultado observable

## Estado después

Qué queda distinto en el sistema cuando el comportamiento ha ocurrido.

## Edge cases

## Fuera de alcance
