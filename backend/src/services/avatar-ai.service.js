const sharp = require('sharp');
const pool = require('../db/pool');

async function generarImagenJpg(descripcion) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const model = process.env.CLOUDFLARE_MODEL || '@cf/black-forest-labs/flux-1-schnell';
  if (!accountId || !token) {
    const error = new Error('Configura CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en backend/.env.');
    error.status = 503;
    throw error;
  }

  const modelPath = model;
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${modelPath}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: descripcion, steps: 4 }),
      signal: AbortSignal.timeout(120000)
    });
  } catch (cause) {
    const error = new Error(`No se pudo conectar con Cloudflare Workers AI: ${cause.message}`);
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.errors?.map((e) => e.message).join('; ') || parsed.message || body;
    } catch {}
    const error = new Error(`Cloudflare Workers AI (${response.status}): ${detail.slice(0, 700)}`);
    error.status = 502;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let sourceBuffer;
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const image = data?.result?.image || data?.result?.data?.[0];
    if (typeof image !== 'string') {
      const error = new Error('Cloudflare no devolvió la imagen en el formato esperado.');
      error.status = 502;
      throw error;
    }
    sourceBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    sourceBuffer = Buffer.from(await response.arrayBuffer());
  }
  if (!sourceBuffer?.length) {
    const error = new Error('Cloudflare devolvió una imagen vacía.');
    error.status = 502;
    throw error;
  }

  try {
    return await sharp(sourceBuffer, { failOn: 'error' })
      .rotate().jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  } catch (cause) {
    const error = new Error(`No se pudo convertir la imagen generada a JPG: ${cause.message}`);
    error.status = 502;
    throw error;
  }
}

async function obtenerAvatar(idCliente) {
  const [rows] = await pool.query(
    `SELECT id_cliente, nombre, apellido, avatar_descripcion,
            avatar_imagen IS NOT NULL AS tiene_imagen, avatar_formato
     FROM clientes WHERE id_cliente = ? LIMIT 1`, [idCliente]
  );
  return rows[0] || null;
}
async function obtenerImagen(idCliente) {
  const [rows] = await pool.query(
    'SELECT avatar_imagen, avatar_formato FROM clientes WHERE id_cliente = ? LIMIT 1', [idCliente]
  );
  return rows[0] || null;
}
async function guardarAvatar(idCliente, descripcion, imagen) {
  const [result] = await pool.query(
    `UPDATE clientes SET avatar_descripcion = ?, avatar_imagen = ?, avatar_formato = 'image/jpeg'
     WHERE id_cliente = ?`, [descripcion, imagen, idCliente]
  );
  return result.affectedRows > 0;
}
module.exports = { generarImagenJpg, obtenerAvatar, obtenerImagen, guardarAvatar };
