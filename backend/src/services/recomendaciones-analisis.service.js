const pool = require("../db/pool");

function normalizar(valor, defecto) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : defecto;
}

function agrupar(filas, campo, defecto) {
  const grupos = new Map();
  for (const fila of filas) {
    const nombre = normalizar(fila[campo], defecto);
    grupos.set(nombre, (grupos.get(nombre) || 0) + 1);
  }
  return [...grupos].map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
}

function agruparCategoriasUrgencias(filas) {
  const grupos = new Map();
  for (const fila of filas) {
    const categoria = normalizar(fila.categoria, "Sin categoría");
    const urgencia = normalizar(fila.urgencia, "Sin urgencia");
    const clave = JSON.stringify([categoria, urgencia]);
    if (!grupos.has(clave)) {
      grupos.set(clave, { categoria, urgencia, total: 0 });
    }
    grupos.get(clave).total++;
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total);
}

async function obtenerDatosAnalisis() {
  const [totales] = await pool.query(
    "SELECT COUNT(*) AS total FROM atencion_cliente"
  );

  const [filas] = await pool.query(
    "SELECT id_consulta, categoria, urgencia, estado_respuesta FROM conversaciones_categoria ORDER BY fecha_creacion DESC, id_consulta DESC LIMIT 100"
  );

  const consultas = [...new Map(
    filas.map(fila => [fila.id_consulta, fila])
  ).values()];

  return {
    totalConversaciones: Number(totales[0]?.total || 0),
    conversacionesAnalizadas: consultas.length,
    categorias: agrupar(consultas, "categoria", "Sin categoría"),
    urgencias: agrupar(consultas, "urgencia", "Sin urgencia"),
    estadosRespuesta: agrupar(consultas, "estado_respuesta", "Sin estado"),
    categoriasPorUrgencia: agruparCategoriasUrgencias(consultas)
  };
}

module.exports = { obtenerDatosAnalisis };