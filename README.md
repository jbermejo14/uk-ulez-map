# UKCleanZone: UK Low Emission Zone, ULEZ & Clean Air Zone Platform

UKCleanZone es una aplicación web rápida, minimalista y responsive para consultar el cumplimiento y las tarifas de las 14 zonas de bajas emisiones del Reino Unido (London ULEZ, Congestion Charge, Clean Air Zones de Inglaterra y LEZ de Escocia).

---

## 1. Obtención de la Clave de la API DVLA (Vehicle Enquiry Service - VES)

La API oficial **Vehicle Enquiry Service (VES)** es proporcionada gratuitamente por la Driver and Vehicle Licensing Agency (DVLA) del Reino Unido para verificar datos de vehículos matriculados.

### Pasos para solicitar acceso:
1. Accede al [Portal de Desarrolladores de la DVLA](https://developer-portal.driver-vehicle-licensing.api.gov.uk/).
2. Regístrate con una cuenta de desarrollador.
3. Solicita acceso al servicio **Vehicle Enquiry API v1.2.0** (`/v1/vehicles`).
4. Una vez aprobada la solicitud, la DVLA te proporcionará una clave de API (`x-api-key`).

> **Nota técnica sobre `euroStatus`:**
> Como documenta la propia DVLA y TfL, el campo `euroStatus` en la base de datos pública de la DVLA suele estar vacío para un porcentaje significativo de vehículos antiguos. Cuando `euroStatus` no viene informado en la respuesta, la aplicación deduce la norma Euro a partir de la fecha de primera matriculación (`yearOfFirstRegistration` y `monthOfFirstRegistration`) y marca el veredicto como **"probable"**, recomendando verificar siempre en el comprobador oficial de la zona.

---

## 2. Configuración de Variables de Entorno

1. Copia el archivo de ejemplo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edita `.env.local` y añade tu clave:
   ```env
   DVLA_VES_API_KEY=tu_clave_api_dvla_aqui
   ```
3. El archivo `.env.local` está incluido en `.gitignore` para garantizar que la clave nunca se exponga ni se suba a repositorios públicos.
4. **Modo de respaldo (sin clave):** Si la clave no está configurada o se encuentra vacía, la ruta `/api/vehicle` responde con el código `KEY_MISSING` (HTTP 503) y la interfaz gráfica activa automáticamente el modo de estimación manual por formato de matrícula, advirtiendo al usuario de que los datos no proceden directamente de la DVLA.

---

## 3. Caché y Límite de Peticiones (Rate Limiting)

La ruta del servidor `app/api/vehicle/route.ts` incorpora mecanismos de protección:

### Caché en Servidor (24 Horas):
- Para no consumir cuota innecesariamente de la API de la DVLA, las respuestas exitosas (HTTP 200) se almacenan en una caché en memoria indexada por la matrícula normalizada (sin espacios y en mayúsculas).
- Las consultas repetidas durante **24 horas (86.400.000 ms)** se sirven directamente desde la memoria con la cabecera `cached: true` y la marca de tiempo de la consulta original.
- Un recolector periódico purga las entradas caducadas cada 10 minutos.

### Límite de Peticiones por IP (Rate Limiting):
- Se extrae la dirección IP del cliente a través de las cabeceras `x-forwarded-for` o `x-real-ip`.
- Cada IP tiene un límite de **20 peticiones por minuto**.
- Si se supera el límite, la API responde con código HTTP 429 (`RATE_LIMITED`) y la interfaz permite al usuario continuar mediante estimación manual.

### Privacidad de Datos:
- **No se registran matrículas** ni en `console.log` ni en herramientas analíticas del servidor.

---

## 4. Niveles de Certeza en el Cumplimiento

Cada veredicto calculado por `checkVehicleCompliance()` devuelve un indicador explícito de certeza:

1. **`confirmado`:** La DVLA devolvió el campo oficial `euroStatus` (o el vehículo está registrado como 100% eléctrico) y la normativa de la zona se aplica sin ambigüedad. También aplica a zonas donde los turismos privados están universalmente exentos por ley (Clase C en Bath, Sheffield, Newcastle, Bradford; Clase B en Portsmouth).
2. **`probable`:** La DVLA no tiene informado el campo `euroStatus` (o la consulta se realiza en modo manual) y el veredicto se deduce de la fecha de matriculación y el combustible. La interfaz muestra un aviso amarillo y un botón directo al comprobador oficial de la zona.
3. **`desconocido`:** Faltan datos clave del vehículo o este pertenece a una categoría con normativas especiales.

---

## 5. Zonas, Fuentes Oficiales y Regla de Frescura

El fichero `data/zones.json` contiene la configuración de las 14 zonas activas del Reino Unido. Cada zona incluye:
- `sourceUrl`: Enlace a la página web oficial del operador de la zona (TfL, ayuntamientos o Transport Scotland).
- `officialCheckerUrl`: Enlace directo al comprobador oficial de matrículas.
- `lastVerified`: Fecha en formato ISO (`YYYY-MM-DD`) de la última revisión de tarifas, multas y horarios.
- `unverifiedFields`: Lista de campos pendientes de confirmación oficial (si aplica).

---

## 6. Ejecución de Pruebas Automatizadas

El proyecto incluye una suite de pruebas sin red (offline) basada en fixtures reales de la DVLA y validación de frescura de datos:

```bash
# Ejecutar todas las pruebas con tsx
npm test
```

### Casos de prueba cubiertos:
1. **Frescura de Zonas:** Falla automáticamente si alguna de las 14 zonas carece de `sourceUrl`, `lastVerified` o si la fecha de verificación tiene más de **180 días**.
2. **Fixture Euro 6 diésel:** Confirma cumplimiento en ULEZ y LEZ de Escocia con certeza `confirmado`.
3. **Fixture Euro 5 diésel:** Confirma infracción/cobro con certeza `confirmado`.
4. **Fixture euroStatus vacío (post-2015):** Valida deducción a Euro 6 con certeza `probable`.
5. **Fixture euroStatus vacío (pre-2015):** Valida deducción a Euro 5 o inferior con certeza `probable`.
6. **Fixture Eléctrico (EV):** Confirma exención del 100% en todas las zonas.
7. **Modo manual de respaldo:** Garantiza que sin datos de la DVLA la certeza nunca sea `confirmado`.
8. **Exenciones por clase de CAZ:** Valida que las zonas de Clase C y B mantengan exentos a los turismos privados.
9. **Zona de Cero Emisiones de Oxford (ZEZ):** Comprueba el cobro a motores de combustión sin importar la norma Euro.
10. **Validación de la API:** Comprueba la normalización de matrículas (`normalizeVRM`) y el formato de errores HTTP 404 y 429.

---

## 7. Construcción y Despliegue

```bash
# Compilar la aplicación Next.js para producción
npm run build

# Iniciar el servidor de producción
npm start
```
