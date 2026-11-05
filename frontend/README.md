# IA para Todos — Frontend React sin Vite

Proyecto de clase realizado con **React 18, JavaScript y Create React App (`react-scripts`)**. **No utiliza Vite.**

## Qué incluye

- **Clientes (naranja):** listado, búsqueda, alta, edición, eliminación y paginación.
- **Chat Bot – SofíaIA (azul):** conversaciones, historial, nuevo chat, caja de mensajes y dictado de voz cuando el navegador lo permite.
- **Avatar (verde salvia):** selección, edición y creación de fichas de avatares, con vista previa.
- Diseño adaptable a ordenador y móvil; cabecera con mano robótica a modo de boceto; menú móvil y cambio de modo claro/oscuro.
- Datos de demostración persistidos en el navegador mediante `localStorage`.

## 1. Requisitos

- Node.js **20 LTS o 22 LTS** y npm instalados.
- Visual Studio Code.

## 2. Arrancar en Windows

1. Descomprime el ZIP en una carpeta, por ejemplo `C:\\proyectos\\ia-para-todos-react`.
2. En VS Code, abre esa carpeta con **Archivo > Abrir carpeta**.
3. Abre **Terminal > Nueva terminal**.
4. Ejecuta:

```bash
npm install
npm start
```

5. Abre `http://localhost:3000`. El navegador normalmente se abrirá automáticamente.

Si el puerto 3000 está ocupado, React preguntará si quieres usar otro.

## 3. Organización para trabajo en equipo

```text
ia-para-todos-react/
  public/
    index.html
    assets/                 # ilustración de mano y retratos de demostración
  src/
    components/
      Brand.js             # logotipo
      Clientes.js          # gestión de clientes
      ChatBot.js           # pantalla de chat
      Avatar.js            # pantalla de avatares
    data/
      demo.js              # datos iniciales
    App.js                 # navegación entre pestañas
    index.js               # entrada de React
    styles.css             # estilos y diseño responsive
  package.json
  README.md
```

Reparto sugerido: una persona trabaja en `Clientes.js`, otra en `ChatBot.js`, otra en `Avatar.js` y otra coordina `App.js` y `styles.css`.

## 4. Importante: qué es demostración y qué es real

Este ZIP **solo contiene el frontend**. No incluye servidor Express, base de datos MySQL, claves de API, ni llamadas a un modelo de inteligencia artificial.

- Los clientes y las conversaciones se guardan **solo en el navegador de ese equipo**, no entre usuarios distintos.
- El Chat Bot muestra una **respuesta de demostración**. Para respuestas reales, conecta un endpoint de tu backend, por ejemplo `POST /api/chat`.
- La creación de avatar guarda **nombre, estilo, género y rol**. La generación de retratos nuevos con IA debe desarrollarse con un backend externo.
- El botón de imagen avisa de que falta la conexión con un servicio de generación de imágenes.
- El micrófono depende del navegador, los permisos y su API de reconocimiento de voz.
- Las imágenes incluidas en `public/assets` provienen del diseño visual generado para este prototipo.

## 5. Integrarlo con un backend existente

En `src/components/ChatBot.js`, reemplaza la respuesta ficticia de la función `enviar` por una petición `fetch` a la API. Para clientes, sustituye `localStorage` por peticiones a tu API REST. No coloques claves secretas en código React: consérvalas en el backend.

## 6. Compilar

```bash
npm run build
```

La compilación optimizada se guarda en `build/`.
