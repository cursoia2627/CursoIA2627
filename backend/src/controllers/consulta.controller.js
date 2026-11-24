const service = require("../services/consulta.service");
const {
  consultaBody,
  consultaUpdateBody,
  id,
  listQuery,
} = require("../validators/consulta.validator");
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
async function list(req, res) {
  res.json({ data: await service.list(parse(listQuery, req.query), req.user) });
}
async function catalogos(req, res) {
  res.json({ data: await service.catalogos() });
}
async function resumenCategoria(req, res) {
  res.json({ data: await service.resumen("categoria", req.user) });
}
async function resumenUrgencia(req, res) {
  res.json({ data: await service.resumen("urgencia", req.user) });
}
async function resumenSatisfaccion(req, res) {
  res.json({ data: await service.resumenSatisfaccion(req.user) });
}
async function get(req, res) {
  const x = await service.get(parse(id, req.params.id), req.user);
  if (!x) throw new AppError(404, "Consulta no encontrada.", "NOT_FOUND");
  res.json({ data: x });
}
async function create(req, res) {
  res
    .status(201)
    .json({
      data: await service.create(parse(consultaBody, req.body), req.user),
    });
}
async function update(req, res) {
  const changes = parse(consultaUpdateBody, req.body);
  if (
    req.user.Rol !== "Administrador" &&
    ("id_categoria" in changes || "id_urgencia" in changes)
  )
    throw new AppError(
      403,
      "Solo el administrador puede cambiar la clasificación.",
      "FORBIDDEN",
    );
  const x = await service.update(parse(id, req.params.id), changes, req.user);
  if (!x) throw new AppError(404, "Consulta no encontrada.", "NOT_FOUND");
  res.json({ data: x });
}
async function remove(req, res) {
  if (!(await service.remove(parse(id, req.params.id), req.user)))
    throw new AppError(404, "Consulta no encontrada.", "NOT_FOUND");
  res.status(204).end();
}
module.exports = {
  list,
  catalogos,
  resumenCategoria,
  resumenUrgencia,
  resumenSatisfaccion,
  get,
  create,
  update,
  remove,
};
