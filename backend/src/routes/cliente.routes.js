const router = require('express').Router();
const controller = require('../controllers/cliente.controller');
const asyncHandler = require('../middleware/async-handler');
// Devuelve clientes paginados para mostrar el listado.
router.get('/', asyncHandler(controller.list));
// Devuelve la ficha de un cliente usando su ID.
router.get('/:id', asyncHandler(controller.get));
// Crea una ficha de cliente y devuelve el registro creado.
router.post('/', asyncHandler(controller.create));
// Reemplaza los datos editables de la ficha indicada.
router.put('/:id', asyncHandler(controller.update));
// Elimina el cliente y, por la clave foránea, sus consultas asociadas.
router.delete('/:id', asyncHandler(controller.remove));
module.exports = router;
