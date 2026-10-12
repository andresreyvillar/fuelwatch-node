# Tasks — busqueda-por-provincia

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/busqueda-por-provincia/{suggestions,search,stats,sort-fuel}.test.ts`: un `test.fails` por
      escenario con `/** @scenarios <slug> */`, contra los `GET` reales con `tests/support/fake-supabase.ts`
- [x] 1.2 `./vsk/bin/vsk semaforo busqueda-por-provincia` → todos ROJO (impuesto)
- [x] 1.3 Un zombi por escenario declarado en `zombies.yaml` (find/replace se completan en 2.4)

## 2. Implementación
- [ ] 2.1 Quitar los `.fails` y ver el ROJO REAL: `./vsk/bin/vsk semaforo busqueda-por-provincia`
- [ ] 2.2 `src/lib/provinces.ts`: lista de 52 provincias, coincidencia sin tildes ni posición del artículo y
      `provinceSortFuel()`; `src/lib/fuel.ts`: `getSuggestions()`, `searchStationsByProvince()`, `getProvinceStats()`
- [ ] 2.3 Endpoints `search.ts` (`province`, `fuel`, 400), `stats.ts` (`province`), `suggestions.ts` (delega en
      `getSuggestions()`; retirar su entrada de `vsk/debt.txt`) → `./vsk/bin/vsk semaforo busqueda-por-provincia` VERDE
- [ ] 2.4 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie busqueda-por-provincia`
- [ ] 2.5 `FuelApp.tsx`: sugerencias con tipo, búsqueda/estadística por provincia, orden en el navegador por el
      carburante de `provinceSortFuel()`, última búsqueda guardada con su tipo; `npx tsc --noEmit` limpio y prueba
      manual con `npm run dev` (buscar «ponte», elegir la provincia, cambiar filtros)
- [ ] 2.6 Actualizar `specs/api/{search,stats,suggestions}.md`, `specs/services/fuel-service.md`,
      `specs/components/{fuel-app,filter-form}.md`

## 3. Refactor (ámbar)
- [ ] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [ ] 3.2 `./vsk/bin/vsk gates refactor --change busqueda-por-provincia`

## 4. Verificación y handoff
- [ ] 4.1 `./vsk/bin/vsk gates verify --change busqueda-por-provincia` (receipt queda pendiente hasta el handoff)
- [ ] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change busqueda-por-provincia --fase verify --gate <id>=pass ...`
- [ ] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change busqueda-por-provincia` → todo en verde, también receipt
