const pool = require("../db/pool");

// Catálogo visible para el cliente: solo artículos activos.
async function listar() {
  const [filas] = await pool.query(
    "SELECT id_articulo,nombre,categoria,descripcion,precio,stock FROM articulos WHERE activo=1 ORDER BY categoria,nombre",
  );
  return filas.map((a) => ({
    ...a,
    precio: Number(a.precio),
    stock: Number(a.stock),
    disponible: Number(a.stock) > 0,
  }));
}

module.exports = { listar };
