'use strict';

const ApiError = require('../../utils/ApiError');
const { Notification, EmpAbsence } = require('../../database/models');
const notificationCenter = require('../../utils/notificationCenter');

async function creerNotification(idUser, title, message, payload = null) {
  const notification = await Notification.create({
    idUser,
    title,
    message,
    payload,
    isLu: false,
    type: 'INFO',
  });

  notificationCenter.publish(idUser, {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    payload: notification.payload,
    isLu: notification.isLu,
    createdAt: notification.createdAt,
  });

  return notification;
}

async function listerNotifications(idUser) {
  return Notification.findAll({
    where: { idUser },
    order: [['createdAt', 'DESC']],
  });
}

async function marquerCommeLu(idUser, id) {
  const notification = await Notification.findOne({ where: { id, idUser } });
  if (!notification) {
    throw ApiError.notFound('Notification introuvable');
  }
  notification.isLu = true;
  await notification.save();
  
  // Si la notification concerne une absence, marquer la demande comme vue par le validateur
  if (notification.payload && notification.payload.absenceId) {
    await EmpAbsence.update(
      { vueParValidateur: true },
      { where: { id: notification.payload.absenceId } }
    );
  }
  
  return notification;
}

module.exports = {
  creerNotification,
  listerNotifications,
  marquerCommeLu,
};
