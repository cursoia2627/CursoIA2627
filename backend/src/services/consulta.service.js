
const pool = require("../db/pool");
async function list(
  { limit, offset, estado_respuesta, id, id_categoria, id_urgencia },
  user,
) {
  const f = [],
    v = [];
  if (estado_respuesta) {
    f.push("estado_respuesta=?");
    v.push(estado_respuesta);
  }
  const scopedId = user.Rol === "Administrador" ? id : user.id_cliente;
  if (scopedId) {
    f.push("id=?");
    v.push(scopedId);
  }
  if (id_categoria) {
    f.push("id_categoria=?");
    v.push(id_categoria);
  }
  if (id_urgencia) {
    f.push("id_urgencia=?");
    v.push(id_urgencia);
  }
  const w = f.length ? "WHERE " + f.join(" AND ") : "";
  const [items] = await pool.query(
    "SELECT * FROM conversaciones_categoria " +
      w +
      " ORDER BY fecha_creacion DESC,id_consulta DESC LIMIT ? OFFSET ?",
    [...v, limit, offset],
  );
  const [count] = await pool.query(
    "SELECT COUNT(*) total FROM atencion_cliente " + w,
    v,
  );
  return { items, total: count[0].total, limit, offset };
}
async function get(id, user) {
  const own = user.Rol === "Administrador" ? "" : " AND id=?";
  const args = own ? [id, user.id_cliente] : [id];
  const [r] = await pool.query(
    "SELECT * FROM conversaciones_categoria WHERE id_consulta=?" + own,
    args,
  );
  return r[0] || null;
}
async function catalogos() {
  const [[categorias], [urgencias]] = await Promise.all([
    pool.query(
      "SELECT id_categoria,nombre FROM categoria ORDER BY id_categoria",
    ),
    pool.query("SELECT id_urgencia,nombre FROM urgencia ORDER BY id_urgencia"),
  ]);
  return { categorias, urgencias };
}
async function resumen(tipo, user) {
  const cat = tipo === "categoria";
  const q = cat
    ? user.Rol === "Administrador"
      ? "SELECT c.id_categoria AS id,c.nombre,COUNT(v.id_consulta) total FROM categoria c LEFT JOIN conversaciones_categoria v ON v.id_categoria=c.id_categoria GROUP BY c.id_categoria,c.nombre ORDER BY c.id_categoria"
      : "SELECT c.id_categoria AS id,c.nombre,COUNT(v.id_consulta) total FROM categoria c LEFT JOIN conversaciones_categoria v ON v.id_categoria=c.id_categoria AND v.id=? GROUP BY c.id_categoria,c.nombre ORDER BY c.id_categoria"
    : user.Rol === "Administrador"
      ? "SELECT u.id_urgencia AS id,u.nombre,COUNT(v.id_consulta) total FROM urgencia u LEFT JOIN conversaciones_urgencia v ON v.id_urgencia=u.id_urgencia GROUP BY u.id_urgencia,u.nombre ORDER BY u.id_urgencia"
      : "SELECT u.id_urgencia AS id,u.nombre,COUNT(v.id_consulta) total FROM urgencia u LEFT JOIN conversaciones_urgencia v ON v.id_urgencia=u.id_urgencia AND v.id=? GROUP BY u.id_urgencia,u.nombre ORDER BY u.id_urgencia";
  const [r] = await pool.query(
    q,
    user.Rol === "Administrador" ? [] : [user.id_cliente],
  );
  return r;
}

async function resumenSatisfaccion(user) {
  const filtro = user.Rol === "Administrador" ? "" : " AND a.id=?";
  const parametros =
    user.Rol === "Administrador" ? [] : [user.id_cliente];

  const [categorias] = await pool.query(
    "SELECT c.id_categoria AS id,c.nombre,COUNT(a.id_consulta) AS valoradas," +
      "COALESCE(SUM(a.valoracion=1),0) AS positivas " +
      "FROM categoria c LEFT JOIN atencion_cliente a ON a.id_categoria=c.id_categoria " +
      "AND a.estado_respuesta='respondida' AND a.valoracion IS NOT NULL" +
      filtro +
      " GROUP BY c.id_categoria,c.nombre ORDER BY c.id_categoria",
    parametros,
  );
  const [urgencias] = await pool.query(
    "SELECT u.id_urgencia AS id,u.nombre,COUNT(a.id_consulta) AS valoradas," +
      "COALESCE(SUM(a.valoracion=1),0) AS positivas " +
      "FROM urgencia u LEFT JOIN atencion_cliente a ON a.id_urgencia=u.id_urgencia " +
      "AND a.estado_respuesta='respondida' AND a.valoracion IS NOT NULL" +
      filtro +
      " GROUP BY u.id_urgencia,u.nombre ORDER BY u.id_urgencia",
    parametros,
  );

  const calcularPorcentaje = (items) =>
    items.map((item) => {
      const valoradas = Number(item.valoradas);
      const positivas = Number(item.positivas);
      return {
        ...item,
        valoradas,
        positivas,
        porcentaje: valoradas
          ? Math.round((positivas / valoradas) * 100)
          : null,
      };
    });

  return {
    categorias: calcularPorcentaje(categorias),
    urgencias: calcularPorcentaje(urgencias),
  };
}

// Calcula las consultas resueltas usando MySQL y la valoración del cliente.
async function resumenResueltas(user) {
  const admin = user.Rol === "Administrador";
  const where = admin ? "" : " WHERE id=?";
  const args = admin ? [] : [user.id_cliente];

  const [filas] = await pool.query(
    "SELECT COUNT(*) AS total," +
      "SUM(CASE WHEN estado_respuesta='respondida' AND Respuesta IS NOT NULL AND TRIM(Respuesta)<>'' AND valoracion=1 THEN 1 ELSE 0 END) AS resueltas," +
      "SUM(CASE WHEN estado_respuesta='respondida' AND Respuesta IS NOT NULL AND TRIM(Respuesta)<>'' AND valoracion=0 THEN 1 ELSE 0 END) AS negativas," +
      "SUM(CASE WHEN estado_respuesta='respondida' AND Respuesta IS NOT NULL AND TRIM(Respuesta)<>'' AND valoracion IS NULL THEN 1 ELSE 0 END) AS sinValoracion " +
      "FROM atencion_cliente" + where,
    args,
  );

  const total = Number(filas[0]?.total || 0);
  const resueltas = Number(filas[0]?.resueltas || 0);
  const negativas = Number(filas[0]?.negativas || 0);
  const sinValoracion = Number(filas[0]?.sinValoracion || 0);

  const porcentaje = total > 0
    ? Math.round((resueltas / total) * 100)
    : 0;

  return {
    total,
    resueltas,
    negativas,
    sinValoracion,
    porcentaje
  };
}

// Satisfecho: más del 70% de sus consultas respondidas y valoradas recibieron valoración positiva.
async function porcentajeClientesSatisfechos() {
  const [[resumen]] = await pool.query(
    "SELECT COUNT(*) AS totalClientes, " +
      "COALESCE(SUM(porcentaje_positivas > 0.7), 0) AS clientesSatisfechos " +
      "FROM (SELECT id, AVG(valoracion = 1) AS porcentaje_positivas " +
      "FROM atencion_cliente WHERE estado_respuesta='respondida' " +
      "AND valoracion IS NOT NULL GROUP BY id) AS valoraciones_cliente",
  );
  const totalClientes = Number(resumen.totalClientes);
  const clientesSatisfechos = Number(resumen.clientesSatisfechos);

  return {
    totalClientes,
    clientesSatisfechos,
    porcentaje: totalClientes
      ? Math.round((clientesSatisfechos / totalClientes) * 100)
      : null,
  };
}

async function create(data, user) {
  const id = user.Rol === "Administrador" ? data.id : user.id_cliente;
  const [r] = await pool.query(
    "INSERT INTO atencion_cliente(id,Consulta,id_categoria,id_urgencia) VALUES(?,?,?,?)",
    [id, data.Consulta, data.id_categoria ?? 7, data.id_urgencia ?? 4],
  );
  return get(r.insertId, user);
}
async function update(id, changes, user) {
  const cols = {
      Consulta: "Consulta",
      Respuesta: "Respuesta",
      estado_respuesta: "estado_respuesta",
      id_categoria: "id_categoria",
      id_urgencia: "id_urgencia",
    },
    e = Object.entries(changes),
    s = e.map((x) => cols[x[0]] + "=?"),
    v = e.map((x) => x[1]),
    own = user.Rol === "Administrador" ? "" : " AND id=?";
  if (changes.estado_respuesta === "respondida")
    s.push("fecha_respuesta=NOW()");
  const args = [...v, id];
  if (own) args.push(user.id_cliente);
  const [r] = await pool.query(
    "UPDATE atencion_cliente SET " + s.join(",") + " WHERE id_consulta=?" + own,
    args,
  );
  return r.affectedRows ? get(id, user) : null;
}
async function remove(id, user) {
  const own = user.Rol === "Administrador" ? "" : " AND id=?",
    args = own ? [id, user.id_cliente] : [id];
  const [r] = await pool.query(
    "DELETE FROM atencion_cliente WHERE id_consulta=?" + own,
    args,
  );
  return r.affectedRows > 0;
}
module.exports = {
  list,
  get,
  create,
  update,
  remove,
  catalogos,
  resumen,
  resumenSatisfaccion,
  resumenResueltas,
  porcentajeClientesSatisfechos,
};
