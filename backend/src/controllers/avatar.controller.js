const service = require('../services/avatar-ai.service');
const { AppError } = require('../middleware/error-handler');
const { id: idSchema } = require('../validators/consulta.validator');

function parseId(value) {
  const result = idSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'El identificador del usuario no es válido.', 'VALIDATION_ERROR');
  return result.data;
}
async function get(req, res) {
  const idCliente = parseId(req.params.id);
  const avatar = await service.obtenerAvatar(idCliente);
  if (!avatar) throw new AppError(404, 'Usuario/cliente no encontrado.', 'NOT_FOUND');
  res.json({ data: {
    id: avatar.id_cliente,
    nombre: [avatar.nombre, avatar.apellido].filter(Boolean).join(' '),
    descripcion: avatar.avatar_descripcion || '',
    tieneImagen: Boolean(avatar.tiene_imagen),
    formato: avatar.avatar_formato,
    imagenUrl: avatar.tiene_imagen ? `/api/clientes/${idCliente}/avatar/imagen` : null
  }});
}
async function image(req, res) {
  const idCliente = parseId(req.params.id);
  const avatar = await service.obtenerImagen(idCliente);
  if (!avatar) throw new AppError(404, 'Usuario/cliente no encontrado.', 'NOT_FOUND');
  if (!avatar.avatar_imagen) throw new AppError(404, 'Este usuario todavía no tiene un avatar generado.', 'AVATAR_NOT_FOUND');
  res.set({
    'Content-Type': avatar.avatar_formato || 'image/jpeg',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.send(avatar.avatar_imagen);
}
async function generate(req, res) {
  const idCliente = parseId(req.params.id);
  const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
  if (!descripcion) throw new AppError(400, 'Escribe una descripción para el avatar.', 'VALIDATION_ERROR');
  if (descripcion.length > 2000) throw new AppError(400, 'La descripción no puede superar los 2000 caracteres.', 'VALIDATION_ERROR');
  const existente = await service.obtenerAvatar(idCliente);
  if (!existente) throw new AppError(404, 'Usuario/cliente no encontrado.', 'NOT_FOUND');

  // Genera antes de actualizar: ante un error, el avatar anterior queda intacto.
  const jpg = await service.generarImagenJpg(descripcion);
  await service.guardarAvatar(idCliente, descripcion, jpg);
  res.json({ data: {
    id: idCliente, descripcion, tieneImagen: true, formato: 'image/jpeg',
    imagenUrl: `/api/clientes/${idCliente}/avatar/imagen`,
    mensaje: 'Avatar generado y guardado correctamente.'
  }});
}
module.exports = { get, image, generate };
