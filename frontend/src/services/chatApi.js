// Public address only. Provider credentials belong in the backend.
const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
async function request(path, options = {}) {
  let response;
  try {response = await fetch(BASE + path, {...options, headers:{'Content-Type':'application/json'}});} catch(error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se puede conectar con el servidor. Comprueba que el backend esté arrancado.');
  }
  let payload;
  try { payload = await response.json(); } catch { throw new Error('La API no devolvió JSON válido. Comprueba la dirección del backend.'); }
  if (!response.ok) throw new Error(payload?.error?.message || `Error de API (${response.status}).`);
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) throw new Error('Formato de respuesta de API no válido.');
  return payload.data;
}
async function listAll(path, signal) {
  let offset = 0;
  const items = [], seen = new Set();
  for (;;) {
    const page = await request(`${path}${path.includes('?') ? '&' : '?'}limit=100&offset=${offset}`, {signal});
    if (!Array.isArray(page.items) || !Number.isFinite(Number(page.total))) throw new Error('Listado de API no válido.');
    for (const item of page.items) {
      const id = item.id_consulta ?? item.id_cliente ?? item.id;
      if (!seen.has(id)) {seen.add(id); items.push(item);}
    }
    offset += page.items.length;
    if (offset >= Number(page.total)) return items;
    if (!page.items.length) throw new Error('Historial incompleto. Actualiza para reintentar.');
  }
}
export function listClientes(signal) {return listAll('/api/clientes', signal);}
export function getAiStatus(signal) {return request('/api/ia/status', {signal});}
export async function listConsultas(clienteId, signal) {
  const items = await listAll(`/api/consultas?id=${encodeURIComponent(clienteId)}`, signal);
  if (items.some(item => String(item.id) !== String(clienteId))) throw new Error('La API devolvió consultas de otro cliente. No se mostrará este historial.');
  return items.sort((a,b) => Number(a.id_consulta) - Number(b.id_consulta));
}
export async function createConsulta(clienteId, texto, signal) {
  const item = await request('/api/consultas', {method:'POST', signal, body:JSON.stringify({id:Number(clienteId), Consulta:texto})});
  if (!item?.id_consulta || String(item.id) !== String(clienteId)) throw new Error('La API no confirmó la consulta para el cliente seleccionado.');
  return item;
}
