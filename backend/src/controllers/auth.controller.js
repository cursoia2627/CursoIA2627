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
  const identifier = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "",
    password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!identifier || identifier.length > 254 || !password || password.length > 200)
    throw new AppError(400, "Introduce tu apodo o correo y contraseña.", "VALIDATION_ERROR");
  const r = await auth.login(identifier, password);
  if (!r)
    throw new AppError(401, "Apodo/correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
  res.cookie(COOKIE_NAME, r.token, opts(28800000));
  res.json({ data: { user: r.user } });
}
async function changePassword(req, res) {
  const identifier = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "",
    currentPassword = typeof req.body?.passwordActual === "string" ? req.body.passwordActual : "",
    newPassword = typeof req.body?.passwordNueva === "string" ? req.body.passwordNueva : "";
  if (!identifier || identifier.length > 254 || !currentPassword || !newPassword)
    throw new AppError(400, "Completa todos los campos.", "VALIDATION_ERROR");
  const normalized = newPassword.trim().toLocaleLowerCase("es-ES");
  if (normalized.length < 4 || normalized.length > 200)
    throw new AppError(400, "La nueva contraseña debe tener entre 4 y 200 caracteres.", "VALIDATION_ERROR");
  const changed = await auth.changePassword(identifier, currentPassword, normalized);
  if (!changed)
    throw new AppError(401, "El apodo/correo o la contraseña actual no son válidos.", "INVALID_CREDENTIALS");
  res.json({ data: { message: "Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña." } });
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
module.exports = { login, changePassword, session, logout };
