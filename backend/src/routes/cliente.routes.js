const router = require('express').Router();
const controller = require('../controllers/cliente.controller');
const asyncHandler = require('../middleware/async-handler');
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
module.exports = router;
