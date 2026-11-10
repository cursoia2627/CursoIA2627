function readAiConfig(source = process.env) {
  const integer = (key, fallback, min, max) => {
    const value = Number(source[key] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Configuración IA no válida: ${key}.`);
    return value;
  };
  const mode = source.AI_MODE || 'disabled';
  if (!['disabled', 'gemini'].includes(mode)) throw new Error('AI_MODE debe ser disabled u gemini.');
  const config = {
    mode,
    apiKey: source.GEMINI_API_KEY || '',
    model: source.GEMINI_MODEL || 'gemini-3.6-flash',
    knowledgeFile: source.AI_KNOWLEDGE_FILE || '',
    pollMs: integer('AI_POLL_MS', 3000, 1000, 60000),
    timeoutMs: integer('AI_TIMEOUT_MS', 45000, 1000, 120000),
    historyLimit: integer('AI_HISTORY_LIMIT', 12, 1, 50),
    maxOutputTokens: integer('AI_MAX_OUTPUT_TOKENS', 1200, 128, 4000),
    maxQuestionChars: 8000,
    maxContextChars: 24000,
  };
  if (mode === 'gemini' && (!config.apiKey.trim() || !config.model.trim())) {
    throw new Error('Para activar IA configura GEMINI_API_KEY y GEMINI_MODEL en el servidor.');
  }
  if (!/^gemini-[a-zA-Z0-9.-]{1,100}$/.test(config.model)) throw new Error('GEMINI_MODEL no es un identificador válido.');
  return config;
}
module.exports = {readAiConfig};

