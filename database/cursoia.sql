-- Base de datos cursoia
-- Preparada para integración Backend Render -> Zapier -> IA -> Aiven
-- La notificación a Zapier la realizará el BACKEND después de insertar
-- una nueva consulta. La base de datos no necesita conectarse directamente
-- a Zapier.
-- clientes.Rol se crea con Cliente por defecto. Después de cargar los datos,
-- asigna Administrador manualmente solo a la ficha del gerente.
-- Este archivo elimina y recrea las tablas.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `cursoia`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `cursoia`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `atencion_cliente`;
DROP TABLE IF EXISTS `datos_personales`;
DROP TABLE IF EXISTS `clientes`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen` longblob DEFAULT NULL,
  `Rol` enum('Cliente','Administrador') NOT NULL DEFAULT 'Cliente',
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `clientes` (`id_cliente`, `nombre`, `apellido`, `email`, `telefono`) VALUES
(1, 'Francisco', 'Ruz', 'francisco.ruz@email.com', '600100001'),
(2, 'Sofía', 'García', 'sofia.garcia@email.com', '600100002'),
(3, 'Manuel', 'Mancebo', 'manuel.mancebo@email.com', '600100003'),
(4, 'Elizabeth', 'Vargas', 'elizabeth.vargas@email.com', '600100004'),
(5, 'Claudia', 'Arjona', 'claudia.arjona@email.com', '600100005'),
(6, 'Andrea', 'Martinez', 'andrea.martinez@email.com', '600100006'),
(7, 'Víctor', 'Domech', 'victor.domech@email.com', '600100007'),
(8, 'Ignacio', 'Domech', 'ignacio.domech@email.com', '600100008'),
(9, 'Raquel', 'Cortés', 'raquel.cortes@email.com', '600100009'),
(10, 'Antonio', 'Hernández', 'antonio.hernandez@email.com', '600100010'),
(11, 'Faustino', 'Martinez', 'faustino.martinez@email.com', '600100011'),
(12, 'Laura', 'Mocada', 'laura.mocada@email.com', '600100012');
CREATE TABLE `datos_personales` (
  `id_persona` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  PRIMARY KEY (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `datos_personales` (`nombre`, `apellidos`) VALUES
('Manuel', 'Mancebo'),
('Juan', 'Martinez'),
('jose', 'Vidal'),
('Antonio', 'Mancebo'),
('Procopio', 'Sanchez'),
('Procopio', 'Sanchez');

CREATE TABLE `atencion_cliente` (
  `id_consulta` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL,
  `Consulta` text NOT NULL,
  `Respuesta` text DEFAULT NULL,
  `estado_respuesta` enum('pendiente','procesando','respondida','error') NOT NULL DEFAULT 'pendiente',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_consulta`),
  KEY `idx_consulta_id` (`id`),
  KEY `idx_consulta_estado` (`estado_respuesta`),
  CONSTRAINT `fk_atencion_cliente_cliente`
    FOREIGN KEY (`id`) REFERENCES `clientes` (`id_cliente`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `atencion_cliente` (`id`, `Consulta`, `Respuesta`, `estado_respuesta`) VALUES
(1, '¿Cuál es el horario de atención?', 'Nuestro horario es de lunes a viernes de 9:00 a 18:00.', 'respondida'),
(1, '¿Cómo puedo cambiar mi contraseña?', 'Puede cambiar su contraseña desde el apartado Mi Cuenta.', 'respondida'),
(2, '¿Cómo puedo realizar un pedido?', 'Puede realizar su pedido desde nuestra página web.', 'respondida'),
(2, '¿Qué métodos de pago aceptan?', 'Aceptamos tarjeta, transferencia bancaria y PayPal.', 'respondida'),
(3, '¿Puedo cancelar mi pedido?', 'Sí, puede cancelar el pedido antes de que sea enviado.', 'respondida'),
(3, '¿Cuánto tarda el envío?', 'El envío suele tardar entre 2 y 5 días laborables.', 'respondida'),
(4, '¿Realizan envíos internacionales?', 'Sí, realizamos envíos a varios países de Europa.', 'respondida'),
(4, '¿Cómo puedo devolver un producto?', 'Puede solicitar una devolución dentro de los 30 días posteriores a la compra.', 'respondida'),
(5, '¿Dónde puedo consultar mi factura?', 'Puede consultar sus facturas desde el apartado Mi Cuenta.', 'respondida'),
(5, '¿Puedo recibir la factura por correo?', 'Sí, podemos enviarle la factura a su correo electrónico.', 'respondida'),
(6, '¿Cómo puedo modificar mis datos personales?', 'Puede modificarlos desde su perfil de usuario.', 'respondida'),
(6, '¿Puedo cambiar mi dirección de envío?', 'Sí, puede modificarla antes de confirmar el pedido.', 'respondida'),
(7, '¿Cuánto cuesta el envío?', 'Los gastos de envío dependen del destino y del importe del pedido.', 'respondida'),
(7, '¿El envío es gratuito?', 'El envío es gratuito para pedidos superiores a 50 euros.', 'respondida'),
(8, '¿Cómo puedo hacer una devolución?', 'Debe solicitar la devolución desde su cuenta de cliente.', 'respondida'),
(8, '¿Cuánto tiempo tengo para devolver un producto?', 'Dispone de 30 días desde la recepción del pedido.', 'respondida'),
(9, '¿Puedo cambiar un producto?', 'Sí, puede solicitar un cambio dentro del plazo establecido.', 'respondida'),
(9, '¿Quién paga los gastos de devolución?', 'Depende del motivo de la devolución y de las condiciones de compra.', 'respondida'),
(10, '¿Dónde está mi pedido?', 'Puede consultar el estado del pedido desde su cuenta.', 'respondida'),
(10, '¿Puedo conocer el número de seguimiento?', 'Sí, recibirá el número de seguimiento por correo electrónico.', 'respondida'),
(11, '¿Qué tarjetas aceptan?', 'Aceptamos Visa, Mastercard y otras tarjetas compatibles.', 'respondida'),
(11, '¿Es seguro pagar con tarjeta?', 'Sí, utilizamos sistemas de pago seguros.', 'respondida'),
(12, '¿Puedo pagar mediante PayPal?', 'Sí, PayPal está disponible como método de pago.', 'respondida'),
(12, '¿Puedo pagar mediante transferencia?', 'Sí, ofrecemos la opción de transferencia bancaria.', 'respondida');

COMMIT;






