const router = require('express').Router();
const controller = require('../controllers/consulta.controller');
const asyncHandler = require('../middleware/async-handler');
// Lista consultas con datos básicos del cliente y admite filtros/paginación.
router.get('/', asyncHandler(controller.list));
// Devuelve el detalle de una consulta usando su ID.
router.get('/:id', asyncHandler(controller.get));
// Registra una nueva consulta asociada a un cliente.
router.post('/', asyncHandler(controller.create));
// Modifica uno o varios campos de consulta, respuesta o estado.
router.patch('/:id', asyncHandler(controller.update));
// Elimina la consulta indicada.
router.delete('/:id', asyncHandler(controller.remove));
module.exports = router;
