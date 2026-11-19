const crypto = require("node:crypto");
const pool = require("../db/pool");
const { hashPassword, verifyPassword } = require("./password.service");
const jwt = require("./jwt.service");
const normalizePassword = (password) => String(password).trim().toLocaleLowerCase("es-ES");
function normalizeNickname(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .trim()
    .replace(/\s+/g, " ");
}
async function findUser(identifier) {
  const value = String(identifier || "").trim();
  if (value.includes("@")) {
    const [rows] = await pool.query(
      "SELECT id_cliente,nombre,apellido,email,Rol,password_hash FROM clientes WHERE LOWER(email)=LOWER(?) LIMIT 2",
      [value],
    );
    return rows.length === 1 ? rows[0] : null;
  }
  const [accounts] = await pool.query("SELECT id_cliente,nombre,apellido FROM clientes");
  const nickname = normalizeNickname(value);
  const matches = accounts.filter(
    (account) => normalizeNickname(account.nombre) === nickname,
  );
  if (matches.length !== 1) return null;
  const [rows] = await pool.query(
    "SELECT id_cliente,nombre,apellido,email,Rol,password_hash FROM clientes WHERE id_cliente=? LIMIT 1",
    [matches[0].id_cliente],
  );
  return rows[0] || null;
}
async function login(identifier, password) {
  const u = await findUser(identifier);
  if (!u || !u.password_hash || !(await verifyPassword(normalizePassword(password), u.password_hash)))
    return null;
  const jti = crypto.randomUUID();
  await pool.query("DELETE FROM login_sessions WHERE expires_at<=UTC_TIMESTAMP()");
  await pool.query(
    "INSERT INTO login_sessions (jti,id_cliente,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 28800 SECOND))",
    [jti, u.id_cliente],
  );
  const token = jwt.createToken(u, jti);
  delete u.password_hash;
  return { token, user: u };
}
async function changePassword(identifier, currentPassword, newPassword) {
  const user = await findUser(identifier);
  if (!user?.password_hash || !(await verifyPassword(normalizePassword(currentPassword), user.password_hash)))
    return false;
  const newHash = await hashPassword(newPassword);
  const [result] = await pool.query(
    "UPDATE clientes SET password_hash=? WHERE id_cliente=? AND password_hash=?",
    [newHash, user.id_cliente, user.password_hash],
  );
  if (!result.affectedRows) return false;
  await pool.query("DELETE FROM login_sessions WHERE id_cliente=?", [user.id_cliente]);
  return true;
}
async function logout(token) {
  const p = jwt.verifyToken(token);
  if (p)
    await pool.query(
      "DELETE FROM login_sessions WHERE jti=? AND id_cliente=?",
      [p.jti, p.sub],
    );
}
module.exports = { login, changePassword, logout };

