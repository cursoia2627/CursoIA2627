const pool = require("../db/pool");
const { hashPassword } = require("./password.service");
const fields =
  "id_cliente,nombre,apellido,email,telefono,descripcion,TO_BASE64(imagen) AS imagen,`Rol`";
async function list({ limit, offset }, user) {
  if (user.Rol !== "Administrador") {
    const item = await get(user.id_cliente);
    return { items: item ? [item] : [], total: item ? 1 : 0, limit, offset };
  }
  const [items] = await pool.query(
    "SELECT " + fields + " FROM clientes ORDER BY id_cliente LIMIT ? OFFSET ?",
    [limit, offset],
  );
  const [count] = await pool.query("SELECT COUNT(*) total FROM clientes");
  return { items, total: count[0].total, limit, offset };
}
async function get(id, user) {
  const [r] = await pool.query(
    "SELECT " +
      fields +
      " FROM clientes WHERE id_cliente=?" +
      (user && user.Rol !== "Administrador" ? " AND id_cliente=?" : ""),
    user && user.Rol !== "Administrador" ? [id, user.id_cliente] : [id],
  );
  return r[0] || null;
}
async function create(c) {
  const p = String(c.nombre).trim().split(/\s+/)[0].toLocaleLowerCase("es-ES"),
    h = await hashPassword(p);
  const [r] = await pool.query(
    "INSERT INTO clientes(nombre,apellido,email,telefono,descripcion,imagen,password_hash) VALUES(?,?,?,?,?,?,?)",
    [
      c.nombre,
      c.apellido,
      c.email ?? null,
      c.telefono ?? null,
      c.descripcion ?? null,
      c.imagen ? Buffer.from(c.imagen, "base64") : null,
      h,
    ],
  );
  return get(r.insertId, { Rol: "Administrador" });
}
async function update(id, c, user) {
  const p = String(c.nombre).trim().split(/\s+/)[0].toLocaleLowerCase("es-ES"),
    h = await hashPassword(p),
    own = user.Rol === "Administrador" ? "" : " AND id_cliente=?";
  const vals = [
    c.nombre,
    c.apellido,
    c.email ?? null,
    c.telefono ?? null,
    c.descripcion ?? null,
    c.imagen ? Buffer.from(c.imagen, "base64") : null,
    h,
    id,
  ];
  if (own) vals.push(user.id_cliente);
  const [r] = await pool.query(
    "UPDATE clientes SET nombre=?,apellido=?,email=?,telefono=?,descripcion=?,imagen=?,password_hash=? WHERE id_cliente=?" +
      own,
    vals,
  );
  return r.affectedRows ? get(id, user) : null;
}
async function remove(id) {
  const [r] = await pool.query("DELETE FROM clientes WHERE id_cliente=?", [id]);
  return r.affectedRows > 0;
}
module.exports = { list, get, create, update, remove };
