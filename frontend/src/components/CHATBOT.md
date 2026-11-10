# Chatbot de clientes

La sección usa siempre la API real. No hay selector de modos ni respuestas locales. REACT_APP_CHAT_MODE ya no se utiliza.

## Probar

1. Arrancar backend (puerto 4000 por defecto) con Gemini configurado.
2. Arrancar frontend con npm start y abrir http://localhost:3000.
3. Entrar en Chat Bot y seleccionar un cliente. Los registros proceden de GET /api/clientes.
4. Revisar sus consultas y respuestas guardadas. Se cargan todas las páginas con filtro por ID de cliente y se muestran fechas, estados y totales.
5. Escribir o dictar una pregunta nueva y enviar. Se guarda mediante POST /api/consultas. No reenviar si se pierde la conexión sin comprobar antes el historial.
6. La respuesta de Gemini aparece cuando backend la guarda; se actualizan las pendientes cada 5 segundos.
7. Escuchar una respuesta con su botón de voz. Cambiar de cliente detiene la voz y cancela las peticiones anteriores.

La dirección pública del servidor puede cambiarse con REACT_APP_API_URL antes de arrancar o compilar. No incluir claves en variables de React. Las claves de Gemini pertenecen al .env de backend.

GET /api/ia/status informa de si backend tiene activada la IA; no prueba cuota ni disponibilidad real de Google. Si el asistente está desactivado o no puede comprobarse su estado, el historial sigue disponible y el envío queda bloqueado. Los errores reales se muestran sin sustituirlos por información inventada.

La configuración de empresa y Gemini se documenta en backend/AI.md. La información comercial aprobada debe añadirse allí antes de esperar respuestas específicas sobre horarios, productos o condiciones.

Los datos locales de Clientes y Avatar pertenecen a sus propios módulos. No se usan como clientes ni historial de esta sección. El antiguo historial local del chat no se importa a MySQL ni se muestra.

## Validación

npm test -- --watchAll=false --runInBand
npm run build

Las pruebas usan dobles de red para comprobar aislamiento y errores. No crean consultas en la base real ni consumen saldo.
