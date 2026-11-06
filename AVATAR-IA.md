# Generador de avatares por usuario

Se ha añadido a la pestaña **Avatar** un generador de imágenes basado en Cloudflare Workers AI.

## Funcionamiento
1. La pestaña consulta los clientes registrados en MySQL.
2. Al seleccionar un usuario, carga su descripción e imagen guardadas.
3. El usuario introduce una descripción y pulsa **Generar avatar con IA**.
4. El backend envía el texto a Cloudflare Workers AI, recibe la imagen y la convierte a JPG.
5. Guarda la descripción en `avatar_descripcion` y los bytes JPG en `avatar_imagen` (`LONGBLOB`) de la fila del cliente.
6. Al volver a seleccionar ese usuario, se recupera su avatar.

## Configuración
Añade al archivo `backend/.env` estas variables:

```env
CLOUDFLARE_ACCOUNT_ID=tu_account_id
CLOUDFLARE_API_TOKEN=tu_api_token
CLOUDFLARE_MODEL=@cf/black-forest-labs/flux-1-schnell
```

El token debe tener permisos Workers AI. No lo pongas en el frontend ni en GitHub.

Desde la carpeta `backend`, ejecuta `npm install` para instalar la nueva dependencia `sharp`.

## Endpoints
- `GET /api/clientes/:id/avatar`
- `GET /api/clientes/:id/avatar/imagen`
- `POST /api/clientes/:id/avatar/generar` con `{ "descripcion": "..." }`

## Base de datos
El backend crea automáticamente las columnas que falten en `clientes`:
- `avatar_descripcion TEXT`
- `avatar_imagen LONGBLOB`
- `avatar_formato VARCHAR(30)`

Los campos originales `descripcion` e `imagen` se conservan intactos.

## Nota sobre usuarios
En el código entregado, los registros de usuario están representados por la tabla `clientes`, con clave primaria `id_cliente`. El proyecto no contiene autenticación/login, por lo que la pestaña permite seleccionar un cliente de la base de datos y asociar su avatar a ese ID.
