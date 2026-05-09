'use strict';

const notificationService = require('./notification.service');
const notificationCenter = require('../../utils/notificationCenter');
const { sendSuccess } = require('../../utils/response');
const asyncWrapper = require('../../utils/asyncWrapper');

const subscribe = asyncWrapper(async (req, res) => {
  notificationCenter.subscribe(req.user.id, req, res);
});

const lister = asyncWrapper(async (req, res) => {
  const notifications = await notificationService.listerNotifications(req.user.id);
  return sendSuccess(res, notifications);
});

const marquerLu = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.marquerCommeLu(req.user.id, parseInt(id, 10));
  return sendSuccess(res, notification, 'Notification marquée comme lue');
});

module.exports = { subscribe, lister, marquerLu };
