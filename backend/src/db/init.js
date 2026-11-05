const pool = require('./pool');

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
      \`Rol\` ENUM('Cliente', 'Administrador') NOT NULL DEFAULT 'Cliente'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
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
