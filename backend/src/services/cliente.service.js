const pool = require('../db/pool');
const fields = 'id_cliente, nombre, apellido, email, telefono, descripcion, TO_BASE64(imagen) AS imagen, `Rol`';

async function list({ limit, offset }) {
  const [items] = await pool.query(`SELECT ${fields} FROM clientes ORDER BY id_cliente LIMIT ? OFFSET ?`, [limit, offset]);
  const [count] = await pool.query('SELECT COUNT(*) AS total FROM clientes');
  return { items, total: count[0].total, limit, offset };
}
async function get(id) {
  const [rows] = await pool.query(`SELECT ${fields} FROM clientes WHERE id_cliente = ?`, [id]);
  return rows[0] || null;
}
async function create(c) {
  const [result] = await pool.query(
    'INSERT INTO clientes (nombre, apellido, email, telefono, descripcion, imagen) VALUES (?, ?, ?, ?, ?, ?)',
    [c.nombre, c.apellido, c.email ?? null, c.telefono ?? null, c.descripcion ?? null,
      c.imagen ? Buffer.from(c.imagen, 'base64') : null],
  );
  return get(result.insertId);
}
async function update(id, c) {
  const [result] = await pool.query(
    'UPDATE clientes SET nombre=?, apellido=?, email=?, telefono=?, descripcion=?, imagen=? WHERE id_cliente=?',
    [c.nombre, c.apellido, c.email ?? null, c.telefono ?? null, c.descripcion ?? null,
      c.imagen ? Buffer.from(c.imagen, 'base64') : null, id],
  );
  return result.affectedRows ? get(id) : null;
}
async function remove(id) {
  const [result] = await pool.query('DELETE FROM clientes WHERE id_cliente=?', [id]);
  return result.affectedRows > 0;
}
module.exports = { list, get, create, update, remove };
