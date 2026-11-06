# API CRUD de atención al cliente

Backend REST independiente para que otro equipo conecte su aplicación React. React no forma parte del proyecto y la API no depende de Vite. Se conecta a **MySQL alojado en Aiven**, siguiendo las tablas `clientes` y `atencion_cliente` del archivo `cursoia.sql`.

El servidor API escucha en `http://localhost:4000` para dejar libre el puerto `3000`, que usa Create React App por defecto. CORS permite el frontend en `http://localhost:3000`. La documentación interactiva de Swagger está en `http://localhost:4000/api/docs` y la definición OpenAPI en `http://localhost:4000/api/docs.json`.

El backend queda listo para que el frontend consuma sus rutas, pero el frontend actual todavía guarda clientes y chats en `localStorage`; seguirá mostrando datos locales hasta que su equipo conecte esos componentes a la API. Para clientes, la API acepta el formato de formulario del frontend (`nombre` completo, `correo`, `telefono`) y también el formato de base de datos (`nombre`, `apellido`, `email`). Las respuestas incluyen ambos alias (`id`/`id_cliente`, `correo`/`email`) para facilitar la integración.

## Esquema

La API usa `clientes` y `atencion_cliente`; la tabla `datos_personales` de la referencia no interviene en ese flujo. El archivo recibido es SQL de MySQL y coincide con el motor que usa esta versión del backend. Al arrancar, `src/db/init.js` crea las dos tablas del flujo si todavía no existen, con columnas compatibles con el esquema de referencia. No elimina tablas ni carga automáticamente los INSERT de ejemplo: importa el archivo SQL en la base de Aiven si necesitas sus datos de muestra. Hazlo solo en la base de destino correcta, porque ese script elimina y vuelve a crear las tablas indicadas.

Los nombres de columnas conservan el SQL: `clientes.id_cliente`, `nombre`, `apellido`, `email`, `telefono`, `descripcion`, `imagen`, `Rol`; y `atencion_cliente.id_consulta`, `id`, `Consulta`, `Respuesta`, `estado_respuesta`, `fecha_creacion`, `fecha_respuesta`. `imagen` se envía/recibe como base64 y se almacena como `LONGBLOB`.

## Requisitos y configuración

- Node.js 20 o superior y npm.
- Servicio MySQL activo en Aiven y sus datos de conexión.

Desde esta carpeta instala dependencias:

```bash
npm install
```

Copia `.env.example` como `.env` y rellena `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los valores de la consola de Aiven. Con `DB_SSL=true` (predeterminado), la conexión viaja cifrada y no hace falta descargar el certificado para empezar. Para verificar también la identidad del servidor, descarga **CA Certificate** en Aiven y define `DB_SSL_CA=./aiven-ca.pem`; en ese caso guarda el certificado en la carpeta `backend`. Sin `DB_SSL_CA`, el cliente acepta el certificado del servidor sin validarlo, lo que simplifica el desarrollo pero es menos seguro frente a una posible suplantación. No compartas ni subas `.env`. `CORS_ORIGIN` debe contener `http://localhost:3000` para el frontend actual; permite varios orígenes separados por comas.

```bash
npm run dev
```

Para ejecución normal: `npm start`. La API escucha en `http://localhost:4000` por defecto (`PORT` permite cambiarlo). En el navegador abre `http://localhost:4000/api/docs` para probar los endpoints. Si ya tienes un `.env` de una versión anterior, actualiza sus valores a `PORT=4000` y `CORS_ORIGIN=http://localhost:3000`.

## Endpoints

### Clientes (`/api/clientes`)

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/clientes?limit=20&offset=0` | Listar clientes |
| GET | `/api/clientes/:id` | Obtener un cliente |
| POST | `/api/clientes` | Crear cliente |
| PUT | `/api/clientes/:id` | Reemplazar los datos editables |
| DELETE | `/api/clientes/:id` | Eliminar cliente y consultas asociadas |

POST y PUT requieren `nombre` (1–50 caracteres) y `apellido` (1–50). `email`, `telefono`, `descripcion` e `imagen` son opcionales y admiten `null`. `imagen` es una cadena base64. Los clientes nuevos reciben el rol `Cliente`; la API no permite asignar `Administrador`.

### Consultas (`/api/consultas`)

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/consultas?limit=20&offset=0` | Listar consultas y datos básicos de cliente |
| GET | `/api/consultas?estado_respuesta=pendiente&id=1` | Filtrar por estado/cliente |
| GET | `/api/consultas/:id` | Obtener una consulta |
| POST | `/api/consultas` | Crear consulta para un cliente |
| PATCH | `/api/consultas/:id` | Modificar consulta, respuesta o estado |
| DELETE | `/api/consultas/:id` | Eliminar consulta |

Para crear, envía `id` (ID del cliente) y `Consulta`. Los estados admitidos son `pendiente`, `procesando`, `respondida` y `error`; al cambiar el estado a `respondida`, se registra `fecha_respuesta`.

`GET /api/health` comprueba que la API está activa. Las listas devuelven `{ "data": { "items": [], "total": 0, "limit": 20, "offset": 0 } }`; las operaciones individuales usan `{ "data": ... }`. Los errores usan `{ "error": { "code": "...", "message": "..." } }`. Entrada inválida devuelve `400`; recurso inexistente, `404`.

## Ejemplos

Crear cliente y consulta:

```bash
curl -X POST http://localhost:4000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","apellido":"Pérez","email":"ana@example.com","telefono":"600123123"}'

curl -X POST http://localhost:4000/api/consultas \
  -H "Content-Type: application/json" \
  -d '{"id":1,"Consulta":"¿Cuál es el horario de atención?"}'
```

Responder consulta y listar pendientes:

```bash
curl -X PATCH http://localhost:4000/api/consultas/1 \
  -H "Content-Type: application/json" \
  -d '{"Respuesta":"Atendemos de lunes a viernes.","estado_respuesta":"respondida"}'

curl "http://localhost:4000/api/consultas?estado_respuesta=pendiente&limit=10&offset=0"
```

La API no implementa autenticación. Añadid autenticación/autorización antes de publicar escrituras en internet. El SQL indica que el backend notificará a Zapier al insertar consultas; esa integración externa no está incluida en este CRUD.
