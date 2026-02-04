# Configuración de Cron Job - Fuel Watch

Este documento explica cómo configurar la actualización automática de precios de combustible.

## Opciones Disponibles

### Opción 1: Easycron (Gratuito - Recomendado)

**Pasos:**

1. Ve a https://www.easycron.com/
2. Crea una cuenta (gratuito)
3. Haz clic en "Add Cron"
4. Configura:
   - **Cron Expression**: `0 * * * *` (cada hora)
   - **URL**: `https://tu-dominio.com/api/update-prices?token=fuel-watch-sync-secret-123`
   - **HTTP Method**: GET
   - **Timeout**: 300 segundos (5 minutos)

5. Guarda y verifica que funciona

**Nota**: Reemplaza:
- `tu-dominio.com` con tu dominio real
- `fuel-watch-sync-secret-123` con el token de tu `.env` (variable `CRON_TOKEN`)

---

### Opción 2: GitHub Actions

**Pasos:**

1. Crea `.github/workflows/cron-fuel.yml`:

```yaml
name: Update Fuel Prices

on:
  schedule:
    - cron: '0 * * * *'  # Cada hora

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Update fuel prices
        run: |
          curl -X GET "https://tu-dominio.com/api/update-prices?token=${{ secrets.CRON_TOKEN }}"
```

2. Ve a Settings → Secrets and variables → Actions
3. Crea un secret `CRON_TOKEN` con tu token
4. El workflow se ejecutará automáticamente cada hora

---

### Opción 3: Cloudflare Worker + Cron Trigger

**Para usuarios con Cloudflare Pro o superior:**

1. Crea un nuevo Worker en Cloudflare Dashboard
2. Reemplaza el código con:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const token = env.CRON_TOKEN;
    const url = `https://tu-dominio.com/api/update-prices?token=${token}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log('Sync successful:', data);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
};
```

3. En el Worker, ve a Triggers → Cron Triggers
4. Añade: `0 * * * *` (cada hora)
5. Deploy

---

### Opción 4: Script Local (Desarrollo)

Para probar localmente:

```bash
# Ejecutar sincronización manualmente
curl "http://localhost:4321/api/update-prices?token=fuel-watch-sync-secret-123"
```

---

## Variables de Entorno Requeridas

En tu `.env`:

```
CRON_TOKEN=tu-token-secreto-aqui
```

Este token es **obligatorio** para ejecutar el sincronización.

---

## Testeo

Después de configurar el cron, verifica que funciona:

```bash
# Reemplaza con tu URL real y token
curl "https://tu-dominio.com/api/update-prices?token=fuel-watch-sync-secret-123"

# Respuesta esperada:
# {"success":true,"count":12051}
```

---

## Frecuencia Recomendada

- **`0 * * * *`** = Cada hora (recomendado)
- **`0 0 * * *`** = Una vez al día
- **`*/15 * * * *`** = Cada 15 minutos

---

## Monitoreo

Para verificar que el cron se ejecuta:

1. Ve a tu BD Supabase
2. Revisa la columna `fecha_actualizacion` en la tabla `servicestations`
3. Debería actualizarse automáticamente según la frecuencia configurada

---

## Troubleshooting

**Error 401 (Unauthorized)**
- Verifica que el token en la URL coincide con `CRON_TOKEN` en `.env`

**Error 500**
- Revisa los logs de Astro
- Verifica que la BD está accesible
- Comprueba que el API del Ministerio está disponible

**El cron no se ejecuta**
- Verifica que la URL es correcta
- Asegúrate que el servicio de cron está activo
- Revisa los logs del servicio de cron (Easycron, GitHub, etc.)
