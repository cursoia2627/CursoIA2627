const pool = require('../db/pool');

async function list({ limit, offset, estado_respuesta, id }) {
  const filters = [];
  const values = [];
  if (estado_respuesta) { values.push(estado_respuesta); filters.push('a.estado_respuesta=?'); }
  if (id) { values.push(id); filters.push('a.id=?'); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [items] = await pool.query(`SELECT a.*, c.nombre, c.apellido, c.email FROM atencion_cliente a
    JOIN clientes c ON c.id_cliente=a.id ${where}
    ORDER BY a.fecha_creacion DESC, a.id_consulta DESC LIMIT ? OFFSET ?`, [...values, limit, offset]);
  const [count] = await pool.query(`SELECT COUNT(*) AS total FROM atencion_cliente a ${where}`, values);
  return { items, total: count[0].total, limit, offset };
}
async function get(id) {
  const [rows] = await pool.query(`SELECT a.*, c.nombre, c.apellido, c.email FROM atencion_cliente a
    JOIN clientes c ON c.id_cliente=a.id WHERE a.id_consulta=?`, [id]);
  return rows[0] || null;
}
async function create({ id, Consulta }) {
  const [result] = await pool.query('INSERT INTO atencion_cliente (id, `Consulta`) VALUES (?, ?)', [id, Consulta]);
  return get(result.insertId);
}
async function update(id, changes) {
  const columns = { Consulta: '`Consulta`', Respuesta: '`Respuesta`', estado_respuesta: 'estado_respuesta' };
  const entries = Object.entries(changes);
  const set = entries.map(([key]) => `${columns[key]}=?`);
  const values = entries.map(([, value]) => value);
  if (changes.estado_respuesta === 'respondida') set.push('fecha_respuesta=NOW()');
  const [result] = await pool.query(
    `UPDATE atencion_cliente SET ${set.join(', ')} WHERE id_consulta=?`, [...values, id],
  );
  return result.affectedRows ? get(id) : null;
}
async function remove(id) {
  const [result] = await pool.query('DELETE FROM atencion_cliente WHERE id_consulta=?', [id]);
  return result.affectedRows > 0;
}
module.exports = { list, get, create, update, remove };
