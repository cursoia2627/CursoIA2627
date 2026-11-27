const r = require("express").Router(),
  c = require("../controllers/pedido.controller"),
  w = require("../middleware/async-handler");

r.get("/", w(c.listarArticulos));

module.exports = r;
