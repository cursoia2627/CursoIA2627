
const router = require("express").Router();
const pool = require("../db/pool");
const asyncHandler = require("../middleware/async-handler");
const { AppError } = require("../middleware/error-handler");
const { readAiConfig } = require("../config/ai");
const { createProvider } = require("../services/ai-provider");
const { generarRecomendacionesConGemini } = require("../services/recomendaciones-ia.service");
const { obtenerDatosAnalisis } = require("../services/recomendaciones-analisis.service");

const selectRows = "SELECT r.id_recomendacion AS id,r.id_cliente AS cliente_id,CONCAT_WS(' ',c.nombre,c.apellido) AS cliente_nombre,r.necesidad,r.titulo,r.descripcion AS recomendacion,r.fecha_creacion AS fecha FROM recomendaciones r LEFT JOIN clientes c ON c.id_cliente=r.id_cliente";

router.get("/analisis", asyncHandler(async (req, res) => {
  if (req.user?.Rol !== "Administrador")
    throw new AppError(403, "Solo los administradores pueden consultar los análisis globales.", "FORBIDDEN");

  const [registros] = await pool.query(
    "SELECT id_recomendacion AS id,titulo,descripcion AS recomendaciones,fecha_creacion AS fechaGeneracion FROM recomendaciones WHERE necesidad = ? AND id_cliente IS NULL ORDER BY id_recomendacion DESC LIMIT 30",
    ["ANALISIS_GLOBAL"]
  );

  res.json({ data: registros });
}));

router.get("/", asyncHandler(async (req, res) => {
  const admin = req.user.Rol === "Administrador";
  const where = admin ? "" : " WHERE r.id_cliente=?";
  const args = admin ? [] : [req.user.id_cliente];
  const [items] = await pool.query(
    selectRows + where + " ORDER BY r.fecha_creacion DESC,r.id_recomendacion DESC LIMIT 100",
    args,
  );
  res.json({ data: items });
}));

router.post("/generar", asyncHandler(async (req, res) => {
  const clienteId = Number(req.body?.cliente_id);
  const necesidad = typeof req.body?.necesidad === "string" ? req.body.necesidad.trim() : "";

  if (!Number.isSafeInteger(clienteId) || clienteId < 1 || !necesidad || necesidad.length > 2000)
    throw new AppError(400, "Selecciona un cliente y escribe una necesidad válida.", "VALIDATION_ERROR");

  if (req.user.Rol !== "Administrador" && Number(req.user.id_cliente) !== clienteId)
    throw new AppError(403, "No tienes permiso para generar recomendaciones para otro cliente.", "FORBIDDEN");

  const [clientes] = await pool.query(
    "SELECT id_cliente,nombre,apellido FROM clientes WHERE id_cliente=?",
    [clienteId],
  );

  const cliente = clientes[0];

  if (!cliente)
    throw new AppError(404, "Cliente no encontrado.", "NOT_FOUND");

  const config = readAiConfig();

  if (config.mode !== "gemini")
    throw new AppError(503, "La inteligencia artificial no está activada.", "AI_DISABLED");

  let recomendacion;

  try {
    const responder = createProvider(config);
    recomendacion = await responder({
      id: clienteId,
      id_consulta: 0,
      Consulta: "Necesidad del cliente: " + necesidad + "\nGenera una recomendación breve, clara y personalizada utilizando exclusivamente la información aprobada de la empresa. No inventes productos, precios ni condiciones. Si faltan datos, indícalo.",
    }, []);
  } catch (error) {
    console.error("Error al generar recomendación:", error.message);
    throw new AppError(503, "No se pudo generar la recomendación con IA.", "AI_UNAVAILABLE");
  }

  if (typeof recomendacion !== "string" || !recomendacion.trim())
    throw new AppError(503, "La IA no devolvió una recomendación válida.", "AI_INVALID_RESPONSE");

  const titulo = ("Recomendación para " + cliente.nombre + " " + cliente.apellido).slice(0, 160);

  const [resultado] = await pool.query(
    "INSERT INTO recomendaciones(id_cliente,id_categoria,necesidad,titulo,descripcion) VALUES (?,NULL,?,?,?)",
    [clienteId, necesidad, titulo, recomendacion.trim()],
  );

  const [registros] = await pool.query(
    selectRows + " WHERE r.id_recomendacion=?",
    [resultado.insertId],
  );

  res.status(201).json({ data: registros[0] });
}));

router.post("/analizar", asyncHandler(async (req, res) => {
  if (req.user?.Rol !== "Administrador")
    throw new AppError(403, "Solo los administradores pueden analizar todas las conversaciones.", "FORBIDDEN");

  const datos = await obtenerDatosAnalisis();

  if (datos.conversacionesAnalizadas === 0)
    throw new AppError(422, "No existen conversaciones para analizar.", "NO_DATA");

  const config = readAiConfig();

  if (config.mode !== "gemini")
    throw new AppError(503, "La inteligencia artificial no está activada.", "AI_DISABLED");

  const instrucciones = [
    "Actúa como analista de calidad y mejora de atención al cliente.",
    "Analiza los siguientes datos estadísticos obtenidos de MySQL.",
    "Tu objetivo es generar recomendaciones concretas para mejorar la atención al cliente.",
    "Utiliza exclusivamente las estadísticas proporcionadas.",
    "No inventes conversaciones, causas, porcentajes ni problemas que no estén respaldados por los datos.",
    "No afirmes conocer el contenido de conversaciones individuales.",
    "Distingue entre la urgencia registrada de una consulta y la prioridad de una acción de mejora.",
    "Genera tres recomendaciones: prioridad ALTA, MEDIA y BAJA.",
    "Para cada recomendación incluye:",
    "1. Título.",
    "2. Prioridad.",
    "3. Problema detectado y cifras que lo sustentan.",
    "4. Acción concreta para mejorar el servicio.",
    "5. Indicador que permita comprobar la mejora.",
    "Redacta las recomendaciones en español, de forma clara y profesional.",
    "DATOS ESTADÍSTICOS:",
    JSON.stringify(datos)
  ].join("\n");

  let recomendaciones;

   try {
    recomendaciones = await generarRecomendacionesConGemini(datos);
  } catch (error) {
    console.error("Error al analizar conversaciones con Gemini:", error.message);
    throw new AppError(503, "No se pudieron generar las recomendaciones.", "AI_UNAVAILABLE");
  }

 
  if (typeof recomendaciones !== "string" || !recomendaciones.trim())
    throw new AppError(503, "Gemini no devolvió recomendaciones válidas.", "AI_INVALID_RESPONSE");

  const titulo = `Análisis global de ${datos.conversacionesAnalizadas} conversaciones`;

  const [guardado] = await pool.query(
    "INSERT INTO recomendaciones (id_cliente, id_categoria, necesidad, titulo, descripcion) VALUES (NULL, NULL, ?, ?, ?)",
    ["ANALISIS_GLOBAL", titulo, recomendaciones.trim()]
  );

  const [registros] = await pool.query(
    "SELECT id_recomendacion, fecha_creacion FROM recomendaciones WHERE id_recomendacion = ?",
    [guardado.insertId]
  );

  res.status(201).json({
    data: {
      id: guardado.insertId,
      totalConversaciones: datos.totalConversaciones,
      conversacionesAnalizadas: datos.conversacionesAnalizadas,
      fechaGeneracion: registros[0].fecha_creacion,
      recomendaciones: recomendaciones.trim()
    }
  });
}));


module.exports = router;
