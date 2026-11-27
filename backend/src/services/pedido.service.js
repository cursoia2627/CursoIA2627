const pool = require("../db/pool");
const { AppError } = require("../middleware/error-handler");

const ESTADOS = ["pendiente", "preparando", "enviado", "entregado", "cancelado"];
// Cambios de estado que puede hacer la administración.
const TRANSICIONES = {
  pendiente: ["preparando", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

const aCent = (euros) => Math.round(Number(euros) * 100);

async function lineasDe(ids, conn = pool) {
  if (!ids.length) return new Map();
  const [filas] = await conn.query(
    `SELECT l.id_pedido,l.id_articulo,a.nombre,l.cantidad,l.precio_unitario
     FROM pedido_lineas l JOIN articulos a ON a.id_articulo=l.id_articulo
     WHERE l.id_pedido IN (?) ORDER BY l.id_linea`,
    [ids],
  );
  const mapa = new Map();
  for (const f of filas) {
    if (!mapa.has(f.id_pedido)) mapa.set(f.id_pedido, []);
    mapa.get(f.id_pedido).push({
      id_articulo: f.id_articulo,
      nombre: f.nombre,
      cantidad: Number(f.cantidad),
      precio_unitario: Number(f.precio_unitario),
    });
  }
  return mapa;
}

async function adjuntarLineas(pedidos) {
  const mapa = await lineasDe(pedidos.map((p) => p.id_pedido));
  return pedidos.map((p) => ({
    ...p,
    total: Number(p.total),
    lineas: mapa.get(p.id_pedido) || [],
  }));
}

async function listar({ limit, offset, id }, user) {
  const admin = user.Rol === "Administrador";
  const idCliente = admin ? id : user.id_cliente;
  const where = idCliente ? "WHERE p.id_cliente=?" : "";
  const args = idCliente ? [idCliente] : [];
  const [items] = await pool.query(
    `SELECT p.id_pedido,p.id_cliente,p.fecha_pedido,p.estado,p.total,
            c.nombre,c.apellido
     FROM pedidos p JOIN clientes c ON c.id_cliente=p.id_cliente ${where}
     ORDER BY p.fecha_pedido DESC,p.id_pedido DESC LIMIT ? OFFSET ?`,
    [...args, limit, offset],
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) total FROM pedidos p ${where}`,
    args,
  );
  return { items: await adjuntarLineas(items), total: Number(total), limit, offset };
}

async function obtener(idPedido, user) {
  const propio = user.Rol === "Administrador" ? "" : " AND p.id_cliente=?";
  const args = propio ? [idPedido, user.id_cliente] : [idPedido];
  const [filas] = await pool.query(
    `SELECT p.id_pedido,p.id_cliente,p.fecha_pedido,p.estado,p.total,c.nombre,c.apellido
     FROM pedidos p JOIN clientes c ON c.id_cliente=p.id_cliente
     WHERE p.id_pedido=?${propio}`,
    args,
  );
  if (!filas.length) return null;
  return (await adjuntarLineas(filas))[0];
}

// Crea un pedido. Precio y stock se leen SIEMPRE de la base de datos.
async function crear(lineas, user) {
  // Une líneas repetidas y ordena por artículo (evita bloqueos cruzados).
  const unidas = new Map();
  for (const l of lineas)
    unidas.set(l.id_articulo, (unidas.get(l.id_articulo) || 0) + l.cantidad);
  const ordenadas = [...unidas.entries()].sort((a, b) => a[0] - b[0]);
  if (ordenadas.some(([, cant]) => cant > 10))
    throw new AppError(400, "Máximo 10 unidades por artículo.", "VALIDATION_ERROR");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let totalCent = 0;
    const detalle = [];
    for (const [idArticulo, cantidad] of ordenadas) {
      const [[a]] = await conn.query(
        "SELECT id_articulo,nombre,precio,stock,activo FROM articulos WHERE id_articulo=? FOR UPDATE",
        [idArticulo],
      );
      if (!a || !a.activo)
        throw new AppError(400, "Uno de los artículos no está disponible.", "ARTICLE_UNAVAILABLE");
      if (Number(a.stock) < cantidad)
        throw new AppError(409, `No hay stock suficiente de ${a.nombre}.`, "OUT_OF_STOCK");
      await conn.query("UPDATE articulos SET stock=stock-? WHERE id_articulo=?", [cantidad, idArticulo]);
      const precioCent = aCent(a.precio);
      totalCent += precioCent * cantidad;
      detalle.push([idArticulo, cantidad, precioCent / 100]);
    }
    const [r] = await conn.query(
      "INSERT INTO pedidos(id_cliente,estado,total) VALUES(?,'pendiente',?)",
      [user.id_cliente, totalCent / 100],
    );
    for (const [idArticulo, cantidad, precio] of detalle)
      await conn.query(
        "INSERT INTO pedido_lineas(id_pedido,id_articulo,cantidad,precio_unitario) VALUES(?,?,?,?)",
        [r.insertId, idArticulo, cantidad, precio],
      );
    await conn.commit();
    return obtener(r.insertId, user);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Cambia el estado. Si se cancela, devuelve las unidades al stock.
async function cambiarEstado(idPedido, nuevo, user, { soloPropioPendiente = false } = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[p]] = await conn.query(
      "SELECT id_pedido,id_cliente,estado FROM pedidos WHERE id_pedido=? FOR UPDATE",
      [idPedido],
    );
    if (!p || (soloPropioPendiente && Number(p.id_cliente) !== Number(user.id_cliente))) {
      await conn.rollback();
      return null;
    }
    if (soloPropioPendiente && p.estado !== "pendiente")
      throw new AppError(409, "Solo se pueden cancelar pedidos pendientes.", "INVALID_STATE");
    if (!TRANSICIONES[p.estado]?.includes(nuevo))
      throw new AppError(409, `No se puede pasar de ${p.estado} a ${nuevo}.`, "INVALID_STATE");
    if (nuevo === "cancelado") {
      const [lineas] = await conn.query(
        "SELECT id_articulo,cantidad FROM pedido_lineas WHERE id_pedido=? ORDER BY id_articulo",
        [idPedido],
      );
      for (const l of lineas)
        await conn.query("UPDATE articulos SET stock=stock+? WHERE id_articulo=?", [l.cantidad, l.id_articulo]);
    }
    await conn.query("UPDATE pedidos SET estado=? WHERE id_pedido=?", [nuevo, idPedido]);
    await conn.commit();
    return obtener(idPedido, user);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Texto con los últimos pedidos de UN cliente para el prompt del asistente.
// No incluye nombre, correo, teléfono ni dirección: el proveedor de IA es externo.
async function contextoPedidos(idCliente, max = 5) {
  const [pedidos] = await pool.query(
    "SELECT id_pedido,fecha_pedido,estado,total FROM pedidos WHERE id_cliente=? ORDER BY fecha_pedido DESC,id_pedido DESC LIMIT ?",
    [idCliente, max],
  );
  if (!pedidos.length) return "";
  const mapa = await lineasDe(pedidos.map((p) => p.id_pedido));
  return pedidos
    .map((p) => {
      const fecha = new Date(p.fecha_pedido).toISOString().slice(0, 10);
      const arts = (mapa.get(p.id_pedido) || [])
        .map((l) => `${l.cantidad} x ${l.nombre}`)
        .join(", ");
      return `Pedido ${p.id_pedido} (${fecha}) · estado: ${p.estado} · total: ${Number(p.total).toFixed(2)} euros · ${arts}`;
    })
    .join("\n");
}

module.exports = { ESTADOS, listar, obtener, crear, cambiarEstado, contextoPedidos };
