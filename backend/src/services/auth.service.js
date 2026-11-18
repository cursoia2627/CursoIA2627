const crypto = require("node:crypto");
const pool = require("../db/pool");
const { verifyPassword } = require("./password.service");
const jwt = require("./jwt.service");
async function login(email, password) {
  const [r] = await pool.query(
    "SELECT id_cliente,nombre,apellido,email,Rol,password_hash FROM clientes WHERE LOWER(email)=LOWER(?) LIMIT 1",
    [email],
  );
  const u = r[0],
    p = String(password).trim().toLocaleLowerCase("es-ES");
  if (!u || !u.password_hash || !(await verifyPassword(p, u.password_hash)))
    return null;
  const jti = crypto.randomUUID();
  await pool.query(
    "DELETE FROM login_sessions WHERE expires_at<=UTC_TIMESTAMP()",
  );
  await pool.query(
    "INSERT INTO login_sessions (jti,id_cliente,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 28800 SECOND))",
    [jti, u.id_cliente],
  );
  const token = jwt.createToken(u, jti);
  delete u.password_hash;
  return { token, user: u };
}
async function logout(t) {
  const p = jwt.verifyToken(t);
  if (p)
    await pool.query(
      "DELETE FROM login_sessions WHERE jti=? AND id_cliente=?",
      [p.jti, p.sub],
    );
}
module.exports = { login, logout };
