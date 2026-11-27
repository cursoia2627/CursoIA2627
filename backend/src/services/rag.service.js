// Cliente del servicio RAG (API en Render). Devuelve fragmentos de la base de conocimiento
// (documentos de la empresa y catálogo) parecidos a la pregunta.
// Si el servicio no está configurado o falla, devuelve "sin contexto" y el asistente
// sigue respondiendo como antes (con el documento AI_KNOWLEDGE_FILE, si existe).

async function buscarContexto(pregunta, config, { fetchImpl = globalThis.fetch } = {}) {
  const vacio = { hayContexto: false, contexto: "", fuentes: [] };
  if (!config.ragUrl) return vacio;
  try {
    const r = await fetchImpl(`${config.ragUrl}/buscar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": config.ragApiKey },
      body: JSON.stringify({ pregunta: String(pregunta).slice(0, 500), k: 3 }),
      signal: AbortSignal.timeout(config.ragTimeoutMs),
    });
    if (!r.ok) return vacio;
    const data = await r.json();
    if (!data.hay_contexto || typeof data.contexto !== "string") return vacio;
    return {
      hayContexto: true,
      contexto: data.contexto.slice(0, 6000),
      fuentes: (data.fragmentos || []).map((f) => f.fuente),
    };
  } catch {
    // No se registran la pregunta ni la respuesta; solo se continúa sin contexto.
    return vacio;
  }
}

module.exports = { buscarContexto };
