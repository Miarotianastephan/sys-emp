const {Router} = require('express');
const ferierController = require('./ferier.controller');
const {authenticate, authorize} = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
    createSchema,
    updateSchema,
    listQuerySchema
} = require('./ferier.validation');

const router = Router();

router.use(authenticate);

// liste des jours fériés pour tout les utilisateurs 
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  ferierController.list
);

router.get(
    '/:id',
    ferierController.getFerier
)

// routes réservées aux managers utilisateurs 
router.post(
    '/',
    authorize('GERER_UTILISATEURS'),
    validate(createSchema),
    ferierController.createFerier
)

router.put(
    '/:id',
    authorize('GERER_UTILISATEURS'),
    validate(updateSchema),
    ferierController.updateFerier
)

router.delete(
    '/:id',
    authorize('GERER_UTILISATEURS'),
    ferierController.removeFerier
)

module.exports = router;

