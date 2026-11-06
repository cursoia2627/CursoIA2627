const pool = require('./pool');

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (Number(rows[0].total) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id_cliente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL,
      apellido VARCHAR(50) NOT NULL,
      email VARCHAR(100),
      telefono VARCHAR(20),
      descripcion TEXT,
      imagen LONGBLOB DEFAULT NULL,
      avatar_descripcion TEXT DEFAULT NULL,
      avatar_imagen LONGBLOB DEFAULT NULL,
      avatar_formato VARCHAR(30) NOT NULL DEFAULT 'image/jpeg',
      \`Rol\` ENUM('Cliente', 'Administrador') NOT NULL DEFAULT 'Cliente'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);

  // Migración idempotente para bases de datos ya existentes.
  await ensureColumn('clientes', 'avatar_descripcion', 'TEXT DEFAULT NULL');
  await ensureColumn('clientes', 'avatar_imagen', 'LONGBLOB DEFAULT NULL');
  await ensureColumn('clientes', 'avatar_formato', "VARCHAR(30) NOT NULL DEFAULT 'image/jpeg'");

  await pool.query(`CREATE TABLE IF NOT EXISTS atencion_cliente (
    id_consulta INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id INT NOT NULL,
    \`Consulta\` TEXT NOT NULL,
    \`Respuesta\` TEXT DEFAULT NULL,
    estado_respuesta ENUM('pendiente', 'procesando', 'respondida', 'error') NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL DEFAULT NULL,
    KEY idx_consulta_id (id),
    KEY idx_consulta_estado (estado_respuesta),
    CONSTRAINT fk_atencion_cliente_cliente FOREIGN KEY (id) REFERENCES clientes(id_cliente)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);
}

module.exports = initializeDatabase;
