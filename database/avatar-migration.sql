-- Aplicar sobre la base de datos configurada en backend/.env (por defecto: cursoia).
USE cursoia;

-- Ejecuta solo si las columnas todavía no existen. El backend también realiza
-- esta comprobación automáticamente al arrancar.
ALTER TABLE clientes
  ADD COLUMN avatar_descripcion TEXT NULL,
  ADD COLUMN avatar_imagen LONGBLOB NULL,
  ADD COLUMN avatar_formato VARCHAR(30) NOT NULL DEFAULT 'image/jpeg';
