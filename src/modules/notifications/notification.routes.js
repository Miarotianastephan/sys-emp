'use strict';

const { Router }                 = require('express');
const notificationController     = require('./notification.controller');
const { authenticate }          = require('../../middlewares/auth');
const validate                   = require('../../middlewares/validate');
const { notificationReadSchema } = require('./notification.validation');

const router = Router();

router.use(authenticate);

router.get('/stream', notificationController.subscribe);
router.get('/', notificationController.lister);
router.patch('/:id/read', validate(notificationReadSchema, 'params'), notificationController.marquerLu);

module.exports = router;
