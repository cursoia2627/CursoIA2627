const crypto = require("node:crypto");
const pool = require("../db/pool");
const secret =
  process.env.JWT_SECRET || crypto.randomBytes(48).toString("base64url");
const lifetimeSeconds = 28800;
const b64 = (v) => Buffer.from(v).toString("base64url");
function createToken(u, jti) {
  const now = Math.floor(Date.now() / 1000),
    h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    p = b64(
      JSON.stringify({
        sub: String(u.id_cliente),
        role: u.Rol,
        jti,
        iat: now,
        exp: now + lifetimeSeconds,
      }),
    );
  return (
    h +
    "." +
    p +
    "." +
    crypto
      .createHmac("sha256", secret)
      .update(h + "." + p)
      .digest("base64url")
  );
}
function verifyToken(t) {
  if (typeof t !== "string") return null;
  const a = t.split(".");
  if (a.length !== 3) return null;
  try {
    const h = JSON.parse(Buffer.from(a[0], "base64url")),
      p = JSON.parse(Buffer.from(a[1], "base64url"));
    if (
      h.alg !== "HS256" ||
      h.typ !== "JWT" ||
      !p.sub ||
      !p.jti ||
      !Number.isInteger(p.exp) ||
      p.exp <= Date.now() / 1000
    )
      return null;
    const x = crypto
        .createHmac("sha256", secret)
        .update(a[0] + "." + a[1])
        .digest(),
      y = Buffer.from(a[2], "base64url");
    return x.length === y.length && crypto.timingSafeEqual(x, y) ? p : null;
  } catch {
    return null;
  }
}
async function openSession(t) {
  const p = verifyToken(t);
  if (!p) return null;
  const [r] = await pool.query(
    "SELECT s.jti,s.id_cliente,s.expires_at,c.nombre,c.apellido,c.email,c.Rol FROM login_sessions s JOIN clientes c ON c.id_cliente=s.id_cliente WHERE s.jti=? AND s.id_cliente=? AND s.expires_at>UTC_TIMESTAMP() LIMIT 1",
    [p.jti, p.sub],
  );
  const x = r[0];
  return x
    ? {
        session: x,
        user: {
          id_cliente: x.id_cliente,
          nombre: x.nombre,
          apellido: x.apellido,
          email: x.email,
          Rol: x.Rol,
        },
      }
    : null;
}
module.exports = { createToken, verifyToken, openSession, lifetimeSeconds };
