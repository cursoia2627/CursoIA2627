# Parche para la web CursoIA2627: RAG + catálogo + pedidos

Está hecho sobre vuestro proyecto actual (Express + MySQL + Gemini + React). Solo añade ficheros y toca 7 existentes.

## Qué cambia

**Backend**
- `db/init.js`: al arrancar crea `articulos`, `pedidos` y `pedido_lineas` (si no existen) y la columna `atencion_cliente.origen`. No borra nada.
- Nuevos: `articulo.service.js`, `pedido.service.js`, `pedido.controller.js`, `pedido.validator.js`, `articulo.routes.js`, `pedido.routes.js`, `rag.service.js`.
- `app.js`: monta `/api/articulos` y `/api/pedidos` (detrás del login, como el resto).
- `config/ai.js`: variables `RAG_URL`, `RAG_API_KEY`, `RAG_TIMEOUT_MS` (opcionales).
- `ai-provider.js`: la función `answer` acepta un cuarto parámetro con el contexto de documentos y los pedidos del cliente.
- `ai-worker.js`: antes de llamar a Gemini busca el contexto en el RAG y lee los pedidos **del cliente dueño de la consulta**.

**Frontend**
- Nueva pestaña **Pedidos** (`Pedidos.js`, `pedidos.css`; `App.js` y `api/client.js` modificados). El cliente elige artículos, hace el pedido y ve y cancela los suyos pendientes; el administrador ve todos y cambia el estado.

**Base de datos (a mano, una vez)**
- `database/catalogo-pedidos-datos.sql`: 20 artículos y 27 pedidos de ejemplo (clientes 1 a 12).
- `database/consultas-sinteticas.sql`: 144 consultas de ejemplo con respuesta y valoración, marcadas `origen='sintetico'`.

## Cómo aplicarlo

1. **Copia de seguridad** de la base de datos (`mysqldump`), siempre antes de tocar nada.
2. Copiad el contenido de esta carpeta sobre vuestro repositorio (respetando las rutas), o bien, desde la raíz del repo: `git apply --ignore-whitespace cambios.patch`.
3. Reiniciad el backend (`npm run dev`). Al arrancar crea las tablas nuevas. Comprobad en la consola que no hay errores.
4. Cargad los datos de ejemplo (la opción de juego de caracteres es importante para las tildes):
   ```
   mysql -h HOST -P PUERTO -u USUARIO -p --ssl-mode=REQUIRED --default-character-set=utf8mb4 cursoia < database/catalogo-pedidos-datos.sql
   mysql -h HOST -P PUERTO -u USUARIO -p --ssl-mode=REQUIRED --default-character-set=utf8mb4 cursoia < database/consultas-sinteticas.sql
   ```
   (o desde Workbench, abriendo y ejecutando cada archivo). Nunca ejecutéis `cursoia.sql`: borra las tablas.
5. Añadid a `backend/.env` (sin subirlo a GitHub): `RAG_URL=https://VUESTRA-URL.onrender.com`, `RAG_API_KEY=...`. Sin `RAG_URL`, el asistente funciona como antes.
6. `npm start` en el frontend: aparece la pestaña **Pedidos**.

## Cómo comprobar que funciona

- Como cliente: haced un pedido, comprobad que baja el stock y que podéis cancelarlo mientras esté `pendiente`.
- Como administrador (Andrea, Antonio o Faustino): cambiad un pedido a `enviado`.
- En el Chat Bot, como ese cliente, preguntad «¿en qué estado está mi último pedido?»: el asistente debe decir el estado real.
- Con otro cliente, preguntad por ese mismo pedido: no debe encontrarlo.
- Preguntad «¿qué auriculares tenéis con cancelación de ruido?» y «¿cuántos días tengo para devolver un producto?»: responde con datos del catálogo y de los documentos.
- Apagad el servicio RAG y repetid: el asistente sigue respondiendo, sin ese contexto.

## Seguridad: qué se ha cuidado

- El cliente de un pedido sale de la **sesión**; el precio y el stock salen de la **base de datos**. El navegador no puede cambiarlos.
- El pedido se guarda en una **transacción** con bloqueo de filas: si falta stock en una línea no se guarda nada y dos pedidos a la vez no pueden vender más unidades de las que hay.
- El asistente solo recibe los pedidos del cliente de la consulta (número, fecha, estado, artículos y total). **No recibe nombre, correo, teléfono ni dirección.**
- Los pedidos **no** se indexan en el RAG; se leen de la base de datos en cada consulta.
- Si el servicio RAG falla, la consulta se responde igualmente.

## Limitaciones conocidas

- Probado con MariaDB 10.11 (no con MySQL 8.4 de Aiven): el SQL es estándar, pero probadlo antes de la clase.
- No se ha añadido documentación Swagger de los nuevos endpoints.
- El asistente no crea ni cancela pedidos: se hace desde la pestaña Pedidos.
- En el plan gratuito de Render, la primera consulta tras un rato sin uso puede tardar hasta ~50 s en el RAG.
