const service = require('../services/cliente.service');
const { clienteBody, clienteListQuery } = require('../validators/cliente.validator');
const { id } = require('../validators/consulta.validator');
const { AppError } = require('../middleware/error-handler');

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, 'Datos de entrada no válidos.', 'VALIDATION_ERROR', result.error.issues);
  return result.data;
}
async function list(req, res) {
  res.json({ data: await service.list(parse(clienteListQuery, req.query)) });
}
async function get(req, res) {
  const item = await service.get(parse(id, req.params.id));
  if (!item) throw new AppError(404, 'Cliente no encontrado.', 'NOT_FOUND');
  res.json({ data: item });
}
async function create(req, res) { res.status(201).json({ data: await service.create(parse(clienteBody, req.body)) }); }
async function update(req, res) {
  const item = await service.update(parse(id, req.params.id), parse(clienteBody, req.body));
  if (!item) throw new AppError(404, 'Cliente no encontrado.', 'NOT_FOUND');
  res.json({ data: item });
}
async function remove(req, res) {
  if (!await service.remove(parse(id, req.params.id))) throw new AppError(404, 'Cliente no encontrado.', 'NOT_FOUND');
  res.status(204).end();
}
module.exports = { list, get, create, update, remove };
