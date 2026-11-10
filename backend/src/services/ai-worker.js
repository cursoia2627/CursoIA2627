const { createHash } = require('node:crypto');

function createWorker({ pool, config, answer, database, logger = console }) {
  const lockName = 'sofia-ai-' + createHash('sha256').update(database).digest('hex').slice(0, 40);
  let stopping = false, timer, running;
  async function tick() {
    let connection, locked = false, job, claimedJob = false;
    try {
      connection = await pool.getConnection();
      const [locks] = await connection.query('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
      if (Number(locks[0].acquired) !== 1) return;
      locked = true;
      // A single lock per database serializes generation across server instances.
      const [rows] = await connection.query(`SELECT id_consulta, id, Consulta FROM atencion_cliente
        WHERE estado_respuesta='pendiente' AND (Respuesta IS NULL OR Respuesta='')
        ORDER BY id_consulta ASC LIMIT 1`);
      job = rows[0];
      if (!job || stopping) return;
      const [claimed] = await connection.query(`UPDATE atencion_cliente SET estado_respuesta='procesando', fecha_respuesta=NULL
        WHERE id_consulta=? AND estado_respuesta='pendiente' AND Consulta=? AND (Respuesta IS NULL OR Respuesta='')`, [job.id_consulta, job.Consulta]);
      if (!claimed.affectedRows) { job = null; return; }
      claimedJob = true;
      if (job.Consulta.length > config.maxQuestionChars) throw Object.assign(new Error('Consulta demasiado larga.'), { code: 'AI_INPUT_TOO_LONG' });
      const [history] = await connection.query(`SELECT id_consulta, id, Consulta, Respuesta, estado_respuesta FROM atencion_cliente
        WHERE id=? AND id_consulta<? ORDER BY id_consulta DESC LIMIT ?`, [job.id, job.id_consulta, config.historyLimit]);
      const text = await answer(job, history);
      // Deleted or manually changed rows must never be overwritten.
      await connection.query(`UPDATE atencion_cliente SET Respuesta=?, estado_respuesta='respondida', fecha_respuesta=NOW()
        WHERE id_consulta=? AND estado_respuesta='procesando' AND Consulta=? AND (Respuesta IS NULL OR Respuesta='')`, [text, job.id_consulta, job.Consulta]);
    } catch (error) {
      // No questions, responses, SQL, credentials or raw provider errors in logs.
      logger.error('Procesamiento IA fallido.', { consultaId: job?.id_consulta, code: /^AI_[A-Z0-9_]+$/.test(error.code || '') ? error : 'AI_INTERNAL_ERROR' });
      if (claimedJob && connection && locked) {
        try {
          await connection.query(`UPDATE atencion_cliente SET estado_respuesta='error', fecha_respuesta=NULL
            WHERE id_consulta=? AND estado_respuesta='procesando' AND Consulta=? AND (Respuesta IS NULL OR Respuesta='')`, [job.id_consulta, job.Consulta]);
        } catch { logger.error('No se pudo guardar el estado de error IA. Revisar la consulta manualmente.'); }
      }
    } finally {
      if (connection) {
        let reusable = true;
        if (locked) {
          try { await connection.query('SELECT RELEASE_LOCK(?)', [lockName]); }
          catch { reusable = false; connection.destroy(); }
        }
        if (reusable) {
          try { connection.release(); } catch { logger.error('No se pudo liberar la conexión de IA.'); }
        }
      }
    }
  }
  function start() {
    if (config.mode !== 'gemini' || running || timer) return;
    stopping = false;
    const loop = () => {
      running = tick().finally(() => {
        running = null;
        if (!stopping) timer = setTimeout(() => { timer = null; loop(); }, config.pollMs);
      });
    };
    loop();
  }
  async function stop() { stopping = true; clearTimeout(timer); timer = null; await running; }
  return { start, stop, tick };
}
module.exports = { createWorker };

