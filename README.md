# CursoIA – modificación para generador de avatares

Se conserva la aplicación original (React con Create React App/react-scripts, sin Vite; Node.js/Express; MySQL). La pestaña **Avatar** ahora permite seleccionar un cliente, escribir una descripción y generar una imagen mediante Cloudflare Workers AI.

## Instalación de los cambios

### Backend
1. Copia `backend/.env.example` a `backend/.env` y completa los datos MySQL existentes.
2. Añade las credenciales de Cloudflare:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_MODEL=@cf/black-forest-labs/flux-1-schnell`
3. En una terminal dentro de `backend`, ejecuta:
   ```bash
   npm install
   npm run dev
   ```
   `npm install` instala también `sharp`, añadido para convertir la imagen a JPG, y genera un package-lock.json actualizado.
4. Al iniciar, el backend agrega automáticamente las columnas nuevas que falten.

### Frontend
1. En `frontend`, copia `.env.example` a `.env`.
2. Ejecuta:
   ```bash
   npm install
   npm start
   ```
3. Abre la aplicación en `http://localhost:3000`.

## Cambios en MySQL
Se añaden a la tabla existente `clientes`:
- `avatar_descripcion TEXT`
- `avatar_imagen LONGBLOB`
- `avatar_formato VARCHAR(30)`

No se modifican los campos antiguos `descripcion` ni `imagen`. El detalle de la funcionalidad y sus endpoints está en `AVATAR-IA.md`.

## Importante
El proyecto original no incluye autenticación de usuarios; su entidad de usuario disponible es la tabla `clientes`. Por eso el generador permite elegir el cliente al que se asociará el avatar. El token de Cloudflare debe mantenerse exclusivamente en el backend.
