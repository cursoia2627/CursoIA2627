import { API_BASE } from "../api/url";
const BASE = API_BASE;
async function request(path, options = {}) {
  let r;
  try {
    r = await fetch(BASE + path, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el backend.");
  }
  if (r.status === 204) return null;
  const b = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(b?.error?.message || "No se pudo completar la operación.");
  return b.data;
}
export const authApi = {
  login: (usuario, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario, password }),
    }),
  changePassword: (usuario, passwordActual, passwordNueva) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ usuario, passwordActual, passwordNueva }),
    }),
  session: () => request("/auth/session"),
  logout: () => request("/auth/logout", { method: "POST" }),
};

