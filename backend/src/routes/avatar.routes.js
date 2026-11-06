const router = require('express').Router({ mergeParams: true });
const controller = require('../controllers/avatar.controller');
const asyncHandler = require('../middleware/async-handler');
router.get('/', asyncHandler(controller.get));
router.get('/imagen', asyncHandler(controller.image));
router.post('/generar', asyncHandler(controller.generate));
module.exports = router;
