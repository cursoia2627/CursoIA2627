const swaggerJsdoc = require('swagger-jsdoc');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'CursoIA · API de atención al cliente',
    version: '1.0.0',
    description: 'API REST para gestionar clientes y consultas de atención al cliente.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Servidor local' }],
  tags: [
    { name: 'Estado', description: 'Disponibilidad del backend' },
    { name: 'Clientes', description: 'Operaciones CRUD de clientes' },
    { name: 'Consultas', description: 'Operaciones CRUD de consultas' },
  ],
  components: {
    schemas: {
      ClienteInput: {
        type: 'object', required: ['nombre'], additionalProperties: false,
        properties: {
          nombre: { type: 'string', maxLength: 100, example: 'Ana García', description: 'Nombre completo aceptado para coincidir con el formulario del frontend. También se acepta apellido por separado.' },
          apellido: { type: 'string', maxLength: 50, example: 'García' },
          correo: { type: 'string', format: 'email', maxLength: 100, example: 'ana@example.com', description: 'Alias compatible con el frontend.' },
          email: { type: 'string', format: 'email', maxLength: 100, example: 'ana@example.com' },
          telefono: { type: 'string', maxLength: 20, example: '600123123' },
          descripcion: { type: 'string', nullable: true },
          imagen: { type: 'string', nullable: true, description: 'Imagen codificada en base64.' },
        },
      },
      Cliente: {
        type: 'object', properties: {
          id: { type: 'integer', example: 1 },
          id_cliente: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Ana García' },
          apellido: { type: 'string', example: 'García' },
          correo: { type: 'string', nullable: true, example: 'ana@example.com' },
          email: { type: 'string', nullable: true, example: 'ana@example.com' },
          telefono: { type: 'string', nullable: true, example: '600123123' },
          descripcion: { type: 'string', nullable: true },
          imagen: { type: 'string', nullable: true },
          Rol: { type: 'string', enum: ['Cliente', 'Administrador'] },
        },
      },
      ConsultaInput: {
        type: 'object', required: ['id', 'Consulta'], additionalProperties: false,
        properties: {
          id: { type: 'integer', example: 1, description: 'ID del cliente propietario de la consulta.' },
          Consulta: { type: 'string', minLength: 1, example: '¿Cuál es el horario de atención?' },
        },
      },
      ConsultaPatch: {
        type: 'object', minProperties: 1, additionalProperties: false,
        properties: {
          Consulta: { type: 'string', minLength: 1 },
          Respuesta: { type: 'string', nullable: true },
          estado_respuesta: { type: 'string', enum: ['pendiente', 'procesando', 'respondida', 'error'] },
        },
      },
      Consulta: {
        type: 'object', properties: {
          id_consulta: { type: 'integer', example: 1 },
          id: { type: 'integer', example: 1 },
          Consulta: { type: 'string' },
          Respuesta: { type: 'string', nullable: true },
          estado_respuesta: { type: 'string', enum: ['pendiente', 'procesando', 'respondida', 'error'] },
          fecha_creacion: { type: 'string', format: 'date-time' },
          fecha_respuesta: { type: 'string', format: 'date-time', nullable: true },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', nullable: true },
        },
      },
      ApiError: {
        type: 'object', properties: {
          error: { type: 'object', properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Datos de entrada no válidos.' },
          } },
        },
      },
      ClientEnvelope: { type: 'object', properties: { data: { $ref: '#/components/schemas/Cliente' } } },
      ConsultaEnvelope: { type: 'object', properties: { data: { $ref: '#/components/schemas/Consulta' } } },
    },
    parameters: {
      ResourceId: { in: 'path', name: 'id', required: true, schema: { type: 'integer', minimum: 1 } },
      Limit: { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      Offset: { in: 'query', name: 'offset', schema: { type: 'integer', minimum: 0, default: 0 } },
    },
  },
};

const paths = [
  { path: '/api/health', method: 'get', tag: 'Estado', summary: 'Comprobar que la API está activa', description: 'Comprueba que Express está respondiendo. No realiza una consulta a MySQL.', response: { status: 'string' } },
  { path: '/api/clientes', method: 'get', tag: 'Clientes', summary: 'Listar clientes', description: 'Devuelve clientes paginados. Usa limit y offset para avanzar por el listado.', query: true, list: 'Cliente' },
  { path: '/api/clientes/{id}', method: 'get', tag: 'Clientes', summary: 'Obtener un cliente', description: 'Busca y devuelve la ficha de cliente cuyo identificador coincide con id.', id: true, response: 'ClientEnvelope' },
  { path: '/api/clientes', method: 'post', tag: 'Clientes', summary: 'Crear cliente', description: 'Crea una ficha de cliente. Acepta el nombre completo y el campo correo del formulario frontend, o nombre, apellido y email por separado.', body: 'ClienteInput', response: 'ClientEnvelope', status: '201' },
  { path: '/api/clientes/{id}', method: 'put', tag: 'Clientes', summary: 'Actualizar cliente', description: 'Reemplaza los datos editables del cliente indicado. Envía los campos requeridos en el cuerpo.', id: true, body: 'ClienteInput', response: 'ClientEnvelope' },
  { path: '/api/clientes/{id}', method: 'delete', tag: 'Clientes', summary: 'Eliminar cliente y sus consultas', description: 'Elimina el cliente indicado. MySQL elimina también sus consultas relacionadas por la regla ON DELETE CASCADE.', id: true, status: '204' },
  { path: '/api/consultas', method: 'get', tag: 'Consultas', summary: 'Listar consultas', description: 'Devuelve consultas paginadas con nombre, apellido y correo del cliente. Permite filtrar por estado_respuesta e ID de cliente.', query: true, list: 'Consulta', filters: true },
  { path: '/api/consultas/{id}', method: 'get', tag: 'Consultas', summary: 'Obtener una consulta', description: 'Busca y devuelve una consulta junto con los datos básicos del cliente asociado.', id: true, response: 'ConsultaEnvelope' },
  { path: '/api/consultas', method: 'post', tag: 'Consultas', summary: 'Crear consulta', description: 'Registra el texto de una consulta y la asocia al cliente indicado por id. El estado inicial es pendiente.', body: 'ConsultaInput', response: 'ConsultaEnvelope', status: '201' },
  { path: '/api/consultas/{id}', method: 'patch', tag: 'Consultas', summary: 'Actualizar consulta, respuesta o estado', description: 'Actualiza solo los campos enviados: Consulta, Respuesta o estado_respuesta. Al marcarla como respondida, registra fecha_respuesta.', id: true, body: 'ConsultaPatch', response: 'ConsultaEnvelope' },
  { path: '/api/consultas/{id}', method: 'delete', tag: 'Consultas', summary: 'Eliminar consulta', description: 'Elimina la consulta indicada por su ID.', id: true, status: '204' },
];

function responseObject(spec) {
  if (spec.status === '204') return { description: 'Eliminado correctamente.' };
  const schema = spec.list
    ? { type: 'object', properties: { data: { type: 'object', properties: {
      items: { type: 'array', items: { $ref: `#/components/schemas/${spec.list}` } },
      total: { type: 'integer' }, limit: { type: 'integer' }, offset: { type: 'integer' },
    } } } }
    : spec.response ? { $ref: `#/components/schemas/${spec.response}` }
      : { type: 'object', properties: { status: { type: 'string', example: 'ok' } } };
  return { description: 'Respuesta correcta.', content: { 'application/json': { schema } } };
}

const generatedPaths = {};
for (const spec of paths) {
  const parameters = [];
  if (spec.id) parameters.push({ $ref: '#/components/parameters/ResourceId' });
  if (spec.query) parameters.push({ $ref: '#/components/parameters/Limit' }, { $ref: '#/components/parameters/Offset' });
  if (spec.filters) parameters.push(
    { in: 'query', name: 'estado_respuesta', schema: { type: 'string', enum: ['pendiente', 'procesando', 'respondida', 'error'] } },
    { in: 'query', name: 'id', schema: { type: 'integer', minimum: 1 }, description: 'Filtra por ID de cliente.' },
  );
  const operation = {
    tags: [spec.tag], summary: spec.summary, description: spec.description, parameters,
    responses: { [spec.status || '200']: responseObject(spec) },
  };
  if (spec.body) operation.requestBody = {
    required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${spec.body}` } } },
  };
  if (spec.body || spec.id) operation.responses['400'] = {
    description: 'Parámetros o cuerpo no válidos.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  if (spec.id) operation.responses['404'] = {
    description: 'No se encontró el registro.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  generatedPaths[spec.path] ||= {};
  generatedPaths[spec.path][spec.method] = operation;
}

module.exports = swaggerJsdoc({
  definition: { ...definition, paths: generatedPaths },
  apis: [],
});
