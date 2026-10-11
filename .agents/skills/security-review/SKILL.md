---
name: security-review
description: Revisión de seguridad del gate `security` de VSK — mentalidad de atacante sobre el diff del change pack (entradas, authn/authz, datos, secretos, dependencias, infraestructura), con secciones específicas para TypeScript/Node y Python. Cada hallazgo corregido se cierra con prueba de explotación y prueba de uso legítimo. Usar en la fase verify, cuando el cambio toque endpoints, auth, datos personales, consultas, ficheros, secretos, dependencias o CI, o cuando el usuario pida «revisión de seguridad».
---

# security-review — gate de seguridad

Actúa como atacante y como auditor. Si hay duda razonable, no apruebes: una vulnerabilidad sin señalar
cuesta más que un merge retrasado. Idealmente se ejecuta en un subagente sin el contexto de la
implementación (quien implementa no verifica).

## 1. Alcance
- Diff del change pack contra la rama base: `git diff <base>...HEAD` más lo staged.
- Clasifica cada fichero: superficie pública (endpoint, UI, webhook, CLI), lógica de negocio, datos
  (consultas, migraciones), configuración (env, CI, Docker, IaC), dependencias.
- Para cada superficie pública, ¿quién llega hasta ella y con qué datos?

## 2. Catálogo común (OWASP Top 10 y ASVS resumidos)

| Área | Qué buscar |
|---|---|
| Entradas | validación por esquema en el borde; tipos, longitudes y rangos; rutas y nombres de fichero (path traversal); regex con backtracking catastrófico; deserialización de datos no confiables |
| Inyección | SQL/NoSQL por concatenación; comandos de sistema con entrada del usuario; plantillas; cabeceras (CRLF) |
| Autenticación | verificación completa de tokens (firma, `exp`, `iss`, `aud`, algoritmo fijo); comparación de secretos en tiempo constante; sesiones y cookies (`HttpOnly`, `Secure`, `SameSite`) |
| Autorización | cada operación comprueba propiedad o rol en el servidor (IDOR); controles solo en la interfaz = **cosméticos**; asignación masiva de campos |
| Datos | respuestas que filtran campos sensibles; errores con trazas o SQL; paginación obligatoria; datos personales en logs |
| Secretos | claves en código, tests, fixtures o logs; `.env` fuera del repo; secretos de CI con el mínimo alcance |
| SSRF y red | URLs de usuario hacia la red interna; redirecciones abiertas; CORS con comodín y credenciales; CSRF en endpoints con cookie |
| Dependencias | paquetes nuevos (mantenimiento, popularidad, typosquatting); versiones con CVE: `@audit` del adaptador |
| Infraestructura | contenedores como root; puertos expuestos; permisos de workflows de CI; `pull_request_target` |
| Fallos | un error que se declara «ruidoso» se prueba repitiendo la MISMA petición tres veces: si la segunda no falla igual, se autolimpia y pierde datos. Detectar nunca muta: construir un error no escribe, mueve ni borra nada |

## 3. TypeScript / Node
- Validación con Zod/class-validator/Joi en todos los DTO; `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` en NestJS.
- Prototype pollution (`__proto__`, `constructor.prototype`) en merges de objetos de entrada.
- `eval`, `new Function`, `child_process` con entrada del usuario; `vm` no es un sandbox.
- Promesas sin `await` y rechazos sin manejar en rutas de seguridad; condiciones de carrera en colas.
- JWT: algoritmo fijado, `alg: none` rechazado, claims revalidados contra la fuente de verdad.
- Helmet, rate limiting en endpoints públicos, CORS restrictivo, cookies seguras.
- Frontend: `dangerouslySetInnerHTML`/`v-html`/`innerHTML` con datos de usuario; tokens en `localStorage`.
- ORMs: consultas raw con interpolación (`$queryRawUnsafe`, `query(\`...${x}\`)`).

## 4. Python
- Validación con Pydantic/marshmallow en el borde; nada de `eval`, `exec`, `pickle.loads`, `yaml.load` sin `SafeLoader`, `marshal` sobre datos no confiables.
- `subprocess` con `shell=True` o cadenas construidas con entrada del usuario; usar listas de argumentos.
- SQL con f-strings o `%` sobre la consulta; usar parámetros del driver o del ORM.
- `requests`/`httpx` sin `timeout`, con `verify=False`, o hacia URLs del usuario (SSRF).
- Ficheros: `os.path.join` con rutas absolutas del usuario, `tarfile`/`zipfile` sin validar miembros.
- Django/FastAPI/Flask: `DEBUG` en producción, `SECRET_KEY` en código, CSRF desactivado, `allow_origins=["*"]` con credenciales.
- Criptografía: `random` para tokens (usar `secrets`), hashes rápidos para contraseñas (usar argon2/bcrypt).

## 5. Cerrar hallazgos
Cada hallazgo: severidad (crítica, alta, media, baja), fichero y línea, vector, impacto y corrección.

Un hallazgo corregido se cierra **con prueba, no con razonamiento**:
1. **Explotación:** el vector concreto ejecutado contra el sistema ya arreglado (curl, test, script), que
   ahora debe fallar.
2. **Uso legítimo:** la petición correcta, que debe seguir funcionando.
Las dos órdenes y su salida van al informe. Siempre que se pueda, la explotación queda como test del
proyecto anotado con el escenario afectado. Un control que solo existe en la interfaz se declara
**cosmético** en el código y en el informe; nunca se registra como restricción.

## 6. Veredicto
- Sin hallazgos críticos ni altos abiertos: `vsk run add --change <id> --fase verify --actor verificador --gate security=pass`.
- Con alguno abierto: `--gate security=fail` y la lista. El change vuelve a la fase de implementación.
- Si el fallo revela un patrón repetible, ejecuta la skill `leccion` para convertirlo en gate o regla.
