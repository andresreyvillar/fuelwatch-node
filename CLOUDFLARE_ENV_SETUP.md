# Configurar Variables de Entorno en Cloudflare Pages

## Objetivo

Hacer que las variables de entorno del `.env` local estén disponibles en tu sitio desplegado en Cloudflare Pages.

## Pasos

### Paso 1: Acceder al Dashboard de Cloudflare

1. Ve a https://dash.cloudflare.com/
2. Selecciona tu account
3. Ve a **Workers & Pages**
4. Click en tu proyecto **fuel-watch-frontend**

### Paso 2: Agregar Variables de Entorno

1. Click en **Settings**
2. En la barra lateral, click en **Environment variables**
3. Click en **Production** (es la más importante)

### Paso 3: Copiar Variables Necesarias

Copia estas variables desde tu `.env` local:

#### Variable 1: CRON_TOKEN (Requerida)

```
Variable name: CRON_TOKEN
Value: fuel-watch-sync-secret-123
```

#### Variable 2: Opcionales pero recomendadas

```
Variable name: MINISTRY_API_URL
Value: https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/
```

```
Variable name: PUBLIC_SUPABASE_URL
Value: https://vmcvdpocewzaxqlzldbu.supabase.co
```

```
Variable name: PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE
```

### Paso 4: Guardar

Click en **Save** después de agregar cada variable.

---

## ⚠️ IMPORTANTE: Diferencia entre Public y Private

**Variables públicas** (visibles en el navegador):
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_*` (cualquier cosa con prefijo PUBLIC_)

**Variables privadas** (solo en servidor):
- `CRON_TOKEN`
- `MINISTRY_API_URL`
- `DB_*`

En Cloudflare Pages (que es SSR), ambas están disponibles en el servidor, pero solo las que comienzan con `PUBLIC_` están disponibles en el cliente.

---

## Verificación

### Opción 1: Test Manual

Ejecuta en la consola:

```bash
curl "https://fuelwatch.pages.dev/api/update-prices?token=fuel-watch-sync-secret-123"
```

Resultado esperado:
```json
{"success":true,"count":12051}
```

### Opción 2: Revisar Logs en Cloudflare

1. En el dashboard de Cloudflare Pages
2. Click en tu proyecto
3. Ve a **Deployments**
4. Click en el deployment más reciente
5. Revisa los logs en la sección **Logs**

---

## Después de Agregar Variables

1. **Re-deploy automático**: Los cambios en variables de entorno no requieren re-deploy
2. **Efecto inmediato**: Los cambios están disponibles en la siguiente solicitud
3. **Sin invalidar caché**: Cloudflare mantiene el caché válido

---

## Variables Diferentes para Staging

Si tienes un entorno de staging (para pruebas):

1. Haz los mismos pasos pero selecciona **Preview** en lugar de **Production**
2. Pueden tener valores diferentes (ej: token diferente, URL de test)

---

## Troubleshooting

### El endpoint retorna 401 (Unauthorized)

**Causa**: La variable `CRON_TOKEN` no está configurada o es diferente

**Solución**:
1. Verifica que `CRON_TOKEN` está en Cloudflare Pages → Settings → Environment variables
2. Verifica que el valor coincide con el que envías en la URL
3. Re-deploy (opcional): Ve a tu rama → Re-deploy latest

### Puedo ver las variables en el sitio publicado

**Es normal** si son `PUBLIC_*`, no es una vulnerabilidad. Son intentionalmente públicas.

**No debería ocurrir** si son privadas. Si ves `CRON_TOKEN` en la respuesta, hay un problema.

### Las variables no se aplican

**Soluciones**:
1. Espera 1-2 minutos después de guardar
2. Hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
3. Re-deploy desde GitHub Actions (próximo push a main)

---

## Comandos Útiles

### Listar variables desde línea de comandos (con Wrangler CLI)

```bash
wrangler pages deployment list
wrangler secret list --env production
```

### Agregar variables localmente para testing

```bash
# Crear archivo .env.production (no commitear)
CRON_TOKEN=fuel-watch-sync-secret-123
MINISTRY_API_URL=https://...
```

---

## Resumen

| Acción | Dónde | Importante |
|--------|-------|-----------|
| Variables locales | `.env` (root) | No commitear secretos |
| Variables en Cloudflare | Dashboard → Settings → Environment variables | Requerido para producción |
| Variables en GitHub Actions | Settings → Secrets and variables → Actions | Para el cron job |
| Verificación | `curl` o logs de Cloudflare | Confirma que funciona |

