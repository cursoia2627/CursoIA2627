const service = require("../services/pedido.service");
const articulos = require("../services/articulo.service");
const {
  pedidoBody,
  estadoBody,
  id,
  listQuery,
} = require("../validators/pedido.validator");
const { AppError } = require("../middleware/error-handler");

function parse(schema, value) {
  const r = schema.safeParse(value);
  if (!r.success)
    throw new AppError(400, "Datos de entrada no válidos.", "VALIDATION_ERROR", r.error.issues);
  return r.data;
}

async function listarArticulos(req, res) {
  res.json({ data: await articulos.listar() });
}
async function listar(req, res) {
  res.json({ data: await service.listar(parse(listQuery, req.query), req.user) });
}
async function obtener(req, res) {
  const p = await service.obtener(parse(id, req.params.id), req.user);
  if (!p) throw new AppError(404, "Pedido no encontrado.", "NOT_FOUND");
  res.json({ data: p });
}
async function crear(req, res) {
  const { lineas } = parse(pedidoBody, req.body);
  // El cliente del pedido sale SIEMPRE de la sesión, nunca del cuerpo.
  res.status(201).json({ data: await service.crear(lineas, req.user) });
}
async function cancelar(req, res) {
  const p = await service.cambiarEstado(parse(id, req.params.id), "cancelado", req.user, {
    soloPropioPendiente: true,
  });
  if (!p) throw new AppError(404, "Pedido no encontrado.", "NOT_FOUND");
  res.json({ data: p });
}
async function cambiarEstado(req, res) {
  const { estado } = parse(estadoBody, req.body);
  const p = await service.cambiarEstado(parse(id, req.params.id), estado, req.user);
  if (!p) throw new AppError(404, "Pedido no encontrado.", "NOT_FOUND");
  res.json({ data: p });
}

module.exports = { listarArticulos, listar, obtener, crear, cancelar, cambiarEstado };
