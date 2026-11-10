// Cliente HTTP compartido para el CRUD. Ajusta REACT_APP_API_URL en frontend/.env.
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con el backend (${API_URL}). Verifica que esté encendido y que MySQL esté disponible.`);
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const msg = body?.error?.message || `Error HTTP ${response.status}`;
    const details = body?.error?.details || body?.error?.issues;
    throw new Error(Array.isArray(details) && details.length ? `${msg} ${details.map(x => x.message).join('; ')}` : msg);
  }
  return body?.data ?? body;
}

export const clientesApi = {
  listar: (limit = 100, offset = 0) => api(`/clientes?limit=${limit}&offset=${offset}`),
  obtener: id => api(`/clientes/${id}`),
  crear: cliente => api('/clientes', { method: 'POST', body: JSON.stringify(cliente) }),
  editar: (id, cliente) => api(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(cliente) }),
  eliminar: id => api(`/clientes/${id}`, { method: 'DELETE' }),
};
export const consultasApi = {
  listar: (limit = 100, offset = 0) => api(`/consultas?limit=${limit}&offset=${offset}`),
  obtener: id => api(`/consultas/${id}`),
  crear: consulta => api('/consultas', { method: 'POST', body: JSON.stringify(consulta) }),
  editar: (id, cambios) => api(`/consultas/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
  eliminar: id => api(`/consultas/${id}`, { method: 'DELETE' }),
};
