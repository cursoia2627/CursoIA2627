const r = require("express").Router(),
  c = require("../controllers/pedido.controller"),
  w = require("../middleware/async-handler"),
  { requireRole } = require("../middleware/auth");

r.get("/", w(c.listar));
r.get("/:id", w(c.obtener));
// Solo los clientes hacen pedidos y solo cancelan los suyos pendientes.
r.post("/", requireRole("Cliente"), w(c.crear));
r.patch("/:id/cancelar", requireRole("Cliente"), w(c.cancelar));
// La administración mueve el pedido por sus estados.
r.patch("/:id/estado", requireRole("Administrador"), w(c.cambiarEstado));

module.exports = r;
