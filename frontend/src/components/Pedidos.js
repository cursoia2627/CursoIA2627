import React, { useCallback, useEffect, useState } from "react";
import { ShoppingCart, RefreshCw, XCircle } from "lucide-react";
import { articulosApi, pedidosApi } from "../api/client";
import "./pedidos.css";

const SIGUIENTES = {
  pendiente: ["preparando", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};
const euros = (n) =>
  Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const fecha = (v) => {
  const d = new Date(typeof v === "string" && !v.includes("T") ? v.replace(" ", "T") : v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-ES");
};

export default function Pedidos({ isAdmin = false }) {
  const [articulos, setArticulos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const [arts, peds] = await Promise.all([
        isAdmin ? Promise.resolve([]) : articulosApi.listar(),
        pedidosApi.listar(50, 0),
      ]);
      setArticulos(arts);
      setPedidos(peds.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const lineas = Object.entries(cantidades)
    .map(([id, cantidad]) => ({ id_articulo: Number(id), cantidad: Number(cantidad) }))
    .filter((l) => l.cantidad > 0);
  const total = lineas.reduce((s, l) => {
    const a = articulos.find((x) => x.id_articulo === l.id_articulo);
    return s + (a ? a.precio * l.cantidad : 0);
  }, 0);

  async function realizarPedido() {
    setEnviando(true);
    setError("");
    setAviso("");
    try {
      const p = await pedidosApi.crear(lineas);
      setAviso(`Pedido ${p.id_pedido} realizado por ${euros(p.total)}.`);
      setCantidades({});
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function accion(promesa) {
    setError("");
    setAviso("");
    try {
      await promesa;
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  if (cargando) return <p>Cargando…</p>;

  return (
    <section className="panel pedidos-panel">
      <div className="panel-heading">
        <div className="heading-title">
          <ShoppingCart className="heading-icon" size={30} />
          <div>
            <h2>{isAdmin ? "Pedidos de los clientes" : "Pedidos"}</h2>
            <p>
              {isAdmin
                ? "Cambia el estado de los pedidos. Los clientes lo verán y el asistente también."
                : "Elige artículos y haz tu pedido. El asistente conoce tus pedidos."}
            </p>
          </div>
        </div>
        <button type="button" className="action-button" onClick={cargar}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error && <p role="alert" className="pedidos-error">{error}</p>}
      {aviso && <p role="status" className="pedidos-ok">{aviso}</p>}

      {!isAdmin && (
        <>
          <h3>Catálogo</h3>
          <div className="pedidos-catalogo">
            {articulos.map((a) => (
              <article key={a.id_articulo} className="pedidos-articulo">
                <div>
                  <strong>{a.nombre}</strong>
                  <span className="pedidos-categoria">{a.categoria}</span>
                  <p>{a.descripcion}</p>
                </div>
                <div className="pedidos-compra">
                  <b>{euros(a.precio)}</b>
                  {a.disponible ? (
                    <label>
                      Cantidad
                      <input
                        type="number"
                        min="0"
                        max={Math.min(10, a.stock)}
                        value={cantidades[a.id_articulo] ?? 0}
                        onChange={(e) =>
                          setCantidades({
                            ...cantidades,
                            [a.id_articulo]: Math.max(0, Math.min(10, Number(e.target.value) || 0)),
                          })
                        }
                      />
                    </label>
                  ) : (
                    <span className="pedidos-agotado">Agotado</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="pedidos-resumen">
            <span>
              {lineas.length
                ? `${lineas.reduce((s, l) => s + l.cantidad, 0)} unidades · ${euros(total)}`
                : "Aún no has elegido artículos"}
            </span>
            <button
              type="button"
              className="action-button"
              disabled={!lineas.length || enviando}
              onClick={realizarPedido}
            >
              <ShoppingCart size={16} /> {enviando ? "Enviando…" : "Realizar pedido"}
            </button>
          </div>
        </>
      )}

      <h3>{isAdmin ? "Todos los pedidos" : "Mis pedidos"}</h3>
      {pedidos.length === 0 ? (
        <p>No hay pedidos todavía.</p>
      ) : (
        <div className="pedidos-lista">
          {pedidos.map((p) => (
            <article key={p.id_pedido} className="pedidos-pedido">
              <div>
                <strong>Pedido {p.id_pedido}</strong> · {fecha(p.fecha_pedido)}
                {isAdmin && <> · {p.nombre} {p.apellido}</>}
                <ul>
                  {p.lineas.map((l) => (
                    <li key={l.id_articulo}>
                      {l.cantidad} × {l.nombre}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pedidos-lateral">
                <b>{euros(p.total)}</b>
                <span className={"pedidos-estado estado-" + p.estado}>{p.estado}</span>
                {isAdmin && SIGUIENTES[p.estado].length > 0 && (
                  <select
                    aria-label={`Cambiar estado del pedido ${p.id_pedido}`}
                    value=""
                    onChange={(e) =>
                      e.target.value &&
                      accion(pedidosApi.cambiarEstado(p.id_pedido, e.target.value))
                    }
                  >
                    <option value="">Cambiar estado…</option>
                    {SIGUIENTES[p.estado].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
                {!isAdmin && p.estado === "pendiente" && (
                  <button
                    type="button"
                    className="pedidos-cancelar"
                    onClick={() => accion(pedidosApi.cancelar(p.id_pedido))}
                  >
                    <XCircle size={15} /> Cancelar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
