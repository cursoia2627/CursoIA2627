const r = require("express").Router(),
  c = require("../controllers/auth.controller"),
  w = require("../middleware/async-handler");
r.post("/login", w(c.login));
r.get("/session", w(c.session));
r.post("/logout", w(c.logout));
module.exports = r;
