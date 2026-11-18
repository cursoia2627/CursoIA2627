const auth = require("../services/auth.service");
const { readToken, resolveUser, COOKIE_NAME } = require("../middleware/auth");
const { AppError } = require("../middleware/error-handler");
const opts = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path: "/api",
  maxAge,
});
async function login(req, res) {
  const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "",
    password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || email.length > 254 || password.length > 200)
    throw new AppError(
      400,
      "Introduce el correo y la contraseña.",
      "VALIDATION_ERROR",
    );
  const r = await auth.login(email, password);
  if (!r)
    throw new AppError(
      401,
      "Correo o contraseña incorrectos.",
      "INVALID_CREDENTIALS",
    );
  res.cookie(COOKIE_NAME, r.token, opts(28800000));
  res.json({ data: { user: r.user } });
}
async function session(req, res) {
  const s = await resolveUser(req);
  if (!s) throw new AppError(401, "La sesión no está activa.", "AUTH_REQUIRED");
  res.json({ data: { user: s.user } });
}
async function logout(req, res) {
  await auth.logout(readToken(req));
  res.clearCookie(COOKIE_NAME, opts(0));
  res.status(204).end();
}
module.exports = { login, session, logout };
