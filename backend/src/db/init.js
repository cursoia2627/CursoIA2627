const pool = require("./pool");
const { hashPassword } = require("../services/password.service");
async function ensureColumn(table, column, definition) {
  const [r] = await pool.query(
    "SELECT COUNT(*) total FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?",
    [table, column],
  );
  if (Number(r[0].total) === 0)
    await pool.query(
      "ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition,
    );
}
async function hasConstraint(table, name, type) {
  const [r] = await pool.query(
    "SELECT COUNT(*) total FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME=? AND CONSTRAINT_TYPE=?",
    [table, name, type],
  );
  return Number(r[0].total) > 0;
}
async function classifyHistory() {
  const [r] = await pool.query(
    "SELECT id_consulta,Consulta FROM atencion_cliente WHERE id_categoria=7 OR id_urgencia=4",
  );
  for (const row of r) {
    const t = String(row.Consulta || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    let c = 7;
    if (/suger|propon|seria mejor|me gustaria/.test(t)) c = 6;
    else if (
      /pagar|pago|paypal|tarjeta|transferencia|factura|cargo|cobro/.test(t)
    )
      c = 4;
    else if (
      /error|fall|no funciona|acceder|contrasena|iniciar sesion|web|aplicacion|perfil/.test(
        t,
      )
    )
      c = 2;
    else if (
      /envio|entrega|devol|retras|seguimiento|internacional|gastos de envio|pedido.{0,20}(estado|donde|seguimiento)/.test(
        t,
      )
    )
      c = 1;
    else if (/producto|caracteristica|talla|modelo/.test(t)) c = 3;
    else if (
      /compr|realizar un pedido|hacer un pedido|adquir|precio|catalogo|pedido/.test(
        t,
      )
    )
      c = 5;
    let u = 4;
    if (
      /urgente|inmediato|hoy mismo|fraude|cobro duplicado|pedido perdido|no puedo acceder/.test(
        t,
      )
    )
      u = 1;
    else if (
      /cancel|devol|retras|error|no funciona|problema|factura|cambio/.test(t)
    )
      u = 2;
    else if (t.trim()) u = 3;
    await pool.query(
      "UPDATE atencion_cliente SET id_categoria=IF(id_categoria=7,?,id_categoria),id_urgencia=IF(id_urgencia=4,?,id_urgencia) WHERE id_consulta=?",
      [c, u, row.id_consulta],
    );
  }
}
async function seedPasswords() {
  const [r] = await pool.query(
    "SELECT id_cliente,nombre FROM clientes WHERE password_hash IS NULL",
  );
  for (const x of r) {
    const p = String(x.nombre || "")
      .trim()
      .split(/\s+/)[0]
      .toLocaleLowerCase("es-ES");
    if (p)
      await pool.query(
        "UPDATE clientes SET password_hash=? WHERE id_cliente=? AND password_hash IS NULL",
        [await hashPassword(p), x.id_cliente],
      );
  }
}
async function initializeDatabase() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS clientes (id_cliente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,nombre VARCHAR(50) NOT NULL,apellido VARCHAR(50) NOT NULL,email VARCHAR(100),telefono VARCHAR(20),descripcion TEXT,imagen LONGBLOB DEFAULT NULL,avatar_descripcion TEXT DEFAULT NULL,avatar_imagen LONGBLOB DEFAULT NULL,avatar_formato VARCHAR(30) NOT NULL DEFAULT 'image/jpeg',password_hash VARCHAR(255) DEFAULT NULL,`Rol` ENUM('Cliente','Administrador') NOT NULL DEFAULT 'Cliente') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await ensureColumn("clientes", "avatar_descripcion", "TEXT DEFAULT NULL");
  await ensureColumn("clientes", "avatar_imagen", "LONGBLOB DEFAULT NULL");
  await ensureColumn(
    "clientes",
    "avatar_formato",
    "VARCHAR(30) NOT NULL DEFAULT 'image/jpeg'",
  );
  await ensureColumn("clientes", "password_hash", "VARCHAR(255) DEFAULT NULL");
  await pool.query(
    "UPDATE clientes SET Rol=CASE WHEN id_cliente IN (6,10,11) THEN 'Administrador' ELSE 'Cliente' END",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS atencion_cliente (id_consulta INT NOT NULL AUTO_INCREMENT PRIMARY KEY,id INT NOT NULL,Consulta TEXT NOT NULL,Respuesta TEXT DEFAULT NULL,estado_respuesta ENUM('pendiente','procesando','respondida','error') NOT NULL DEFAULT 'pendiente',fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,fecha_respuesta TIMESTAMP NULL DEFAULT NULL,id_categoria INT NULL,id_urgencia INT NULL,valoracion TINYINT NULL,KEY idx_consulta_id(id),KEY idx_consulta_estado(estado_respuesta),CONSTRAINT fk_atencion_cliente_cliente FOREIGN KEY(id) REFERENCES clientes(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS categoria(id_categoria INT NOT NULL PRIMARY KEY,nombre VARCHAR(80) NOT NULL UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS urgencia(id_urgencia INT NOT NULL PRIMARY KEY,nombre VARCHAR(30) NOT NULL UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "INSERT INTO categoria(id_categoria,nombre) VALUES (1,'queja logística'),(2,'queja técnica'),(3,'duda de producto'),(4,'duda de pago'),(5,'compra'),(6,'sugerencia'),(7,'Sin clasificar') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)",
  );
  await pool.query(
    "INSERT INTO urgencia(id_urgencia,nombre) VALUES (1,'Alta'),(2,'Media'),(3,'Baja'),(4,'Sin clasificar') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)",
  );
  await ensureColumn("atencion_cliente", "id_categoria", "INT NULL");
  await ensureColumn("atencion_cliente", "id_urgencia", "INT NULL");
  await ensureColumn("atencion_cliente", "valoracion", "TINYINT NULL");
  if (!(await hasConstraint("atencion_cliente", "chk_atencion_valoracion", "CHECK"))) {
    const [[invalidRatings]] = await pool.query(
      "SELECT COUNT(*) total FROM atencion_cliente WHERE valoracion IS NOT NULL AND valoracion NOT IN (0,1)",
    );
    if (Number(invalidRatings.total))
      throw new Error("La columna valoracion contiene valores distintos de 0, 1 o NULL.");
    await pool.query(
      "ALTER TABLE atencion_cliente ADD CONSTRAINT chk_atencion_valoracion CHECK (valoracion IN (0,1))",
    );
  }
  await pool.query(
    "UPDATE atencion_cliente SET id_categoria=7 WHERE id_categoria IS NULL",
  );
  await pool.query(
    "UPDATE atencion_cliente SET id_urgencia=4 WHERE id_urgencia IS NULL",
  );
  const [ix] = await pool.query(
    "SELECT COUNT(*) total FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='atencion_cliente' AND INDEX_NAME='idx_atencion_categoria'",
  );
  if (!Number(ix[0].total))
    await pool.query(
      "ALTER TABLE atencion_cliente ADD INDEX idx_atencion_categoria(id_categoria)",
    );
  const [iu] = await pool.query(
    "SELECT COUNT(*) total FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='atencion_cliente' AND INDEX_NAME='idx_atencion_urgencia'",
  );
  if (!Number(iu[0].total))
    await pool.query(
      "ALTER TABLE atencion_cliente ADD INDEX idx_atencion_urgencia(id_urgencia)",
    );
  if (
    !(await hasConstraint(
      "atencion_cliente",
      "fk_atencion_categoria",
      "FOREIGN KEY",
    ))
  )
    await pool.query(
      "ALTER TABLE atencion_cliente ADD CONSTRAINT fk_atencion_categoria FOREIGN KEY(id_categoria) REFERENCES categoria(id_categoria) ON UPDATE CASCADE",
    );
  if (
    !(await hasConstraint(
      "atencion_cliente",
      "fk_atencion_urgencia",
      "FOREIGN KEY",
    ))
  )
    await pool.query(
      "ALTER TABLE atencion_cliente ADD CONSTRAINT fk_atencion_urgencia FOREIGN KEY(id_urgencia) REFERENCES urgencia(id_urgencia) ON UPDATE CASCADE",
    );
  await pool.query(
    "ALTER TABLE atencion_cliente MODIFY id_categoria INT NOT NULL DEFAULT 7,MODIFY id_urgencia INT NOT NULL DEFAULT 4",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS recomendaciones(id_recomendacion INT NOT NULL AUTO_INCREMENT PRIMARY KEY,id_categoria INT NULL,titulo VARCHAR(160) NOT NULL,descripcion TEXT NOT NULL,fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY idx_recomendaciones_categoria(id_categoria),CONSTRAINT fk_recomendaciones_categoria FOREIGN KEY(id_categoria) REFERENCES categoria(id_categoria) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS login_sessions(jti CHAR(36) NOT NULL PRIMARY KEY,id_cliente INT NOT NULL,expires_at DATETIME NOT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,KEY idx_login_sessions_expiration(expires_at),CONSTRAINT fk_login_session_cliente FOREIGN KEY(id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  // Catálogo y pedidos (la carga de datos de ejemplo se hace con database/catalogo-pedidos-datos.sql)
  await pool.query(
    "CREATE TABLE IF NOT EXISTS articulos(id_articulo INT NOT NULL AUTO_INCREMENT PRIMARY KEY,nombre VARCHAR(100) NOT NULL,categoria VARCHAR(50) NOT NULL,descripcion TEXT NOT NULL,precio DECIMAL(8,2) NOT NULL,stock INT NOT NULL DEFAULT 0,activo TINYINT(1) NOT NULL DEFAULT 1,CONSTRAINT chk_articulos_precio CHECK (precio>0),CONSTRAINT chk_articulos_stock CHECK (stock>=0)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS pedidos(id_pedido INT NOT NULL AUTO_INCREMENT PRIMARY KEY,id_cliente INT NOT NULL,fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,estado ENUM('pendiente','preparando','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',total DECIMAL(10,2) NOT NULL,origen ENUM('real','sintetico') NOT NULL DEFAULT 'real',KEY idx_pedidos_cliente(id_cliente),CONSTRAINT fk_pedidos_cliente FOREIGN KEY(id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS pedido_lineas(id_linea INT NOT NULL AUTO_INCREMENT PRIMARY KEY,id_pedido INT NOT NULL,id_articulo INT NOT NULL,cantidad INT NOT NULL,precio_unitario DECIMAL(8,2) NOT NULL,KEY idx_lineas_pedido(id_pedido),KEY idx_lineas_articulo(id_articulo),CONSTRAINT chk_lineas_cantidad CHECK (cantidad>0),CONSTRAINT fk_lineas_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT fk_lineas_articulo FOREIGN KEY(id_articulo) REFERENCES articulos(id_articulo) ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci",
  );
  // Distingue consultas reales de las sintéticas (datos de prueba para el RAG)
  await ensureColumn("atencion_cliente", "origen", "ENUM('real','sintetico') NOT NULL DEFAULT 'real'");
  await pool.query(
    "CREATE OR REPLACE VIEW conversaciones_categoria AS SELECT a.id_consulta,a.id,a.Consulta,a.Respuesta,a.estado_respuesta,a.fecha_creacion,a.fecha_respuesta,a.valoracion,a.id_categoria,cat.nombre categoria,a.id_urgencia,urg.nombre urgencia,c.nombre nombre,c.apellido apellido,c.email email FROM atencion_cliente a JOIN clientes c ON c.id_cliente=a.id JOIN categoria cat ON cat.id_categoria=a.id_categoria JOIN urgencia urg ON urg.id_urgencia=a.id_urgencia",
  );
  await pool.query(
    "CREATE OR REPLACE VIEW conversaciones_urgencia AS SELECT a.id_consulta,a.id,a.Consulta,a.Respuesta,a.estado_respuesta,a.fecha_creacion,a.fecha_respuesta,a.valoracion,a.id_categoria,cat.nombre categoria,a.id_urgencia,urg.nombre urgencia,c.nombre nombre,c.apellido apellido,c.email email FROM atencion_cliente a JOIN clientes c ON c.id_cliente=a.id JOIN categoria cat ON cat.id_categoria=a.id_categoria JOIN urgencia urg ON urg.id_urgencia=a.id_urgencia",
  );
  await classifyHistory();
  await seedPasswords();
}
module.exports = initializeDatabase;
