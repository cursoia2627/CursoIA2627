const service = require("../services/cliente.service");
const {
  clienteBody,
  clienteListQuery,
} = require("../validators/cliente.validator");
const { id } = require("../validators/consulta.validator");
const { AppError } = require("../middleware/error-handler");
function parse(s, v) {
  const r = s.safeParse(v);
  if (!r.success)
    throw new AppError(
      400,
      "Datos de entrada no válidos.",
      "VALIDATION_ERROR",
      r.error.issues,
    );
  return r.data;
}
function frontendCliente(x) {
  if (!x) return x;
  const nombreCompleto = [x.nombre, x.apellido].filter(Boolean).join(" ");
  return { ...x, id: x.id_cliente, nombre: nombreCompleto, correo: x.email };
}
async function list(req, res) {
  const x = await service.list(parse(clienteListQuery, req.query), req.user);
  res.json({ data: { ...x, items: x.items.map(frontendCliente) } });
}
async function get(req, res) {
  const x = await service.get(parse(id, req.params.id), req.user);
  if (!x) throw new AppError(404, "Cliente no encontrado.", "NOT_FOUND");
  res.json({ data: frontendCliente(x) });
}
async function create(req, res) {
  res
    .status(201)
    .json({
      data: frontendCliente(await service.create(parse(clienteBody, req.body))),
    });
}
async function update(req, res) {
  const x = await service.update(
    parse(id, req.params.id),
    parse(clienteBody, req.body),
    req.user,
  );
  if (!x) throw new AppError(404, "Cliente no encontrado.", "NOT_FOUND");
  res.json({ data: frontendCliente(x) });
}
async function remove(req, res) {
  if (!(await service.remove(parse(id, req.params.id))))
    throw new AppError(404, "Cliente no encontrado.", "NOT_FOUND");
  res.status(204).end();
}
module.exports = { list, get, create, update, remove };
