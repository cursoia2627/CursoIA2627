
const r = require("express").Router(),
  c = require("../controllers/consulta.controller"),
  s = require("../services/consulta.service"),
  w = require("../middleware/async-handler"),
  { requireRole } = require("../middleware/auth");

r.get("/", w(c.list));
r.get("/catalogos", w(c.catalogos));
r.get("/resumen/categoria", w(c.resumenCategoria));
r.get("/resumen/urgencia", w(c.resumenUrgencia));

r.get("/resumen/resueltas", w(async (req, res) => {
  const datos = await s.resumenResueltas(req.user);
  res.json({ data: datos });
}));

r.get("/:id", w(c.get));
r.post("/", w(c.create));
r.patch("/:id", requireRole("Administrador"), w(c.update));
r.delete("/:id", requireRole("Administrador"), w(c.remove));

module.exports = r;
