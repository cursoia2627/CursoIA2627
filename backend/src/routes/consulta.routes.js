const router = require('express').Router();
const controller = require('../controllers/consulta.controller');
const asyncHandler = require('../middleware/async-handler');
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
module.exports = router;
