const express = require('express');
const notificationRouter = express.Router();
const notificationController = require('../controller/notificationController');


notificationRouter.post('/invite-users-to-event',notificationController.handleSendNotificationInviteUserToEvent)
notificationRouter.get('/get-all',notificationController.getAll)
notificationRouter.get('/get-notifications-byId',notificationController.getnotificationsById)
notificationRouter.put('/update-isViewed-notifitions',notificationController.updateIsViewedNotifications)
notificationRouter.delete('/delete-notifications',notificationController.deleteNotifications)
notificationRouter.put('/update-status-notifitions',notificationController.updateStatusNotifications)

module.exports = notificationRouter