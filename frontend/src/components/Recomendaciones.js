
import React, { useEffect, useState } from "react";
import { Lightbulb, Sparkles, RefreshCw, AlertTriangle, BarChart3, CheckCircle2, History } from "lucide-react";
import { API_BASE } from "../api/url";

async function solicitar(ruta, opciones = {}) {
  const response = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...opciones.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Tu sesión ha caducado. Inicia sesión nuevamente.");
  }
  if (!response.ok) {
    throw new Error(body.error?.message || body.message || `Error HTTP ${response.status}`);
  }
  return body.data ?? body;
}

function normalizarRegistro(registro) {
  const titulo = registro.titulo || "";
  const coincidencia = titulo.match(/Análisis global de (\d+) conversaciones/i);
  return {
    id: Number(registro.id),
    titulo,
    recomendaciones: registro.recomendaciones || "",
    fechaGeneracion: registro.fechaGeneracion,
    totalConversaciones: registro.totalConversaciones == null ? null : Number(registro.totalConversaciones),
    conversacionesAnalizadas: registro.conversacionesAnalizadas == null
      ? coincidencia ? Number(coincidencia[1]) : null
      : Number(registro.conversacionesAnalizadas)
  };
}

function fechaLegible(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "—" : fecha.toLocaleString("es-ES");
}

function separarRecomendaciones(texto) {
  const lineas = String(texto || "").replace(/\r/g, "").split("\n");
  const introduccion = [];
  const bloques = [];
  let actual = null;

  for (const linea of lineas) {
    const limpia = linea.replace(/\*/g, "").replace(/#/g, "").trim();
    const coincidencia = limpia.match(/^Prioridad\s*:?\s*(ALTA|MEDIA|BAJA)\s*$/i);

    if (coincidencia) {
      actual = { prioridad: coincidencia[1].toLowerCase(), lineas: [] };
      bloques.push(actual);
    } else if (actual) {
      if (limpia) actual.lineas.push(limpia);
    } else if (limpia) {
      introduccion.push(limpia);
    }
  }

  return {
    introduccion: introduccion.join("\n"),
    bloques
  };
}

export default function Recomendaciones({ clienteActual = null }) {
  const [historial, setHistorial] = useState([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState("");
  const esCliente = Boolean(clienteActual && clienteActual.Rol !== "Administrador");

  useEffect(() => {
    if (esCliente) {
      setCargandoHistorial(false);
      return;
    }

    let activo = true;

    async function cargarHistorial() {
      try {
        const datos = await solicitar("/recomendaciones/analisis");
        if (!activo) return;
        if (!Array.isArray(datos)) throw new Error("El historial no tiene un formato válido.");
        const registros = datos.map(normalizarRegistro);
        setHistorial(registros);
        setSeleccionado(registros.length ? String(registros[0].id) : "");
      } catch (err) {
        if (activo) setError("No se pudo cargar el historial: " + err.message);
      } finally {
        if (activo) setCargandoHistorial(false);
      }
    }

    cargarHistorial();

    return () => {
      activo = false;
    };
  }, [esCliente]);

  async function generarAnalisis() {
    setAnalizando(true);
    setError("");

    try {
      const datos = await solicitar("/recomendaciones/analizar", {
        method: "POST",
        body: JSON.stringify({})
      });

      if (!datos || !Number.isSafeInteger(Number(datos.id)) || Number(datos.id) < 1) {
        throw new Error("El servidor no confirmó el registro del análisis en MySQL.");
      }

      if (typeof datos.recomendaciones !== "string" || !datos.recomendaciones.trim()) {
        throw new Error("Gemini no devolvió recomendaciones válidas.");
      }

      const nuevo = normalizarRegistro({
        ...datos,
        titulo: `Análisis global de ${datos.conversacionesAnalizadas} conversaciones`
      });

      setHistorial(anteriores => [
        nuevo,
        ...anteriores.filter(item => item.id !== nuevo.id)
      ]);

      setSeleccionado(String(nuevo.id));
    } catch (err) {
      setError(err.message || "No se pudo generar el análisis.");
    } finally {
      setAnalizando(false);
    }
  }

  const resultado = historial.find(item => String(item.id) === seleccionado);
  const analisis = resultado ? separarRecomendaciones(resultado.recomendaciones) : null;

  if (esCliente) {
    return (
      <div className="dash-subcontent recomendaciones">
        <h3><Lightbulb size={21} /> Recomendaciones de mejora</h3>
        <p>El análisis global de conversaciones está reservado para los administradores.</p>
      </div>
    );
  }

  return (
    <div className="dash-subcontent recomendaciones">
      <div className="recom-analisis-header">
        <div>
          <h3><Lightbulb size={21} /> Recomendaciones inteligentes</h3>
          <p>Analiza las conversaciones de MySQL y descubre oportunidades para mejorar la atención al cliente.</p>
        </div>
        <button type="button" className="recom-button" onClick={generarAnalisis} disabled={analizando}>
          {analizando ? <RefreshCw size={18} /> : <Sparkles size={18} />}
          {analizando ? "Analizando conversaciones..." : "Generar recomendaciones"}
        </button>
      </div>

      {error && (
        <div className="recom-error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {cargandoHistorial && (
        <div className="recom-estado-inicial" role="status">
          <RefreshCw size={28} />
          <h4>Cargando recomendaciones guardadas</h4>
        </div>
      )}

      {!cargandoHistorial && historial.length > 0 && (
        <div className="recom-historial">
          <label htmlFor="historial-recomendaciones">
            <History size={18} /> Historial de análisis guardados en MySQL
          </label>
          <select
            id="historial-recomendaciones"
            value={seleccionado}
            onChange={e => setSeleccionado(e.target.value)}
          >
            {historial.map(item => (
              <option key={item.id} value={String(item.id)}>
                {fechaLegible(item.fechaGeneracion)} — {item.titulo}
              </option>
            ))}
          </select>
        </div>
      )}

      {!cargandoHistorial && historial.length === 0 && !analizando && !error && (
        <div className="recom-estado-inicial">
          <BarChart3 size={35} />
          <h4>Todavía no hay análisis guardados</h4>
          <p>Pulsa «Generar recomendaciones» para analizar las conversaciones y guardar las primeras propuestas en MySQL.</p>
        </div>
      )}

      {analizando && (
        <div className="recom-estado-inicial" role="status">
          <RefreshCw size={30} />
          <h4>Generando un nuevo análisis</h4>
          <p>Gemini está analizando las estadísticas de las conversaciones y preparando recomendaciones.</p>
        </div>
      )}

      {resultado && (
        <div className="recom-resultados">
          <div className="recom-resumen">
            <div>
              <span>Conversaciones registradas</span>
              <strong>{resultado.totalConversaciones ?? "—"}</strong>
            </div>
            <div>
              <span>Conversaciones analizadas</span>
              <strong>{resultado.conversacionesAnalizadas ?? "—"}</strong>
            </div>
            <div>
              <span>Fecha del análisis</span>
              <strong>{fechaLegible(resultado.fechaGeneracion)}</strong>
            </div>
          </div>

          <h3><CheckCircle2 size={21} /> Recomendaciones generadas</h3>

          {analisis.introduccion && (
            <div className="recom-introduccion">{analisis.introduccion}</div>
          )}

          {analisis.bloques.length > 0 ? (
            <div className="recom-lista">
              {analisis.bloques.map((item, i) => {
                const lineaTitulo = item.lineas.find(linea => /^T[ií]tulo\s*:/i.test(linea));
                const titulo = lineaTitulo
                  ? lineaTitulo.replace(/^T[ií]tulo\s*:\s*/i, "")
                  : "Acción de mejora";
                const contenido = item.lineas.filter(linea => linea !== lineaTitulo).join("\n");

                return (
                  <article key={i} className={"recom-tarjeta recom-prioridad-" + item.prioridad}>
                    <span className={"recom-etiqueta recom-etiqueta-" + item.prioridad}>
                      Prioridad {item.prioridad}
                    </span>
                    <h4 className="recom-titulo">{titulo}</h4>
                    <div className="recom-texto">{contenido}</div>
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="recom-tarjeta">
              <div className="recom-texto">{resultado.recomendaciones}</div>
            </article>
          )}

          <p className="recom-aclaracion">
            Análisis guardado en MySQL. Las recomendaciones se generan con inteligencia artificial a partir de estadísticas reales y deben revisarse antes de aplicarlas.
          </p>
        </div>
      )}
    </div>
  );
}
