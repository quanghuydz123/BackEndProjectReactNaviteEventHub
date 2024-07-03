const express = require('express');
const EventRouter = express.Router();
const eventController = require('../controller/eventController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');

EventRouter.post('/add-event',eventController.addEvent)
EventRouter.get('/get-all',eventController.getAllEvent)
EventRouter.get('/get-events',eventController.getEvents)
EventRouter.post('/update-followers',eventController.updateFollowerEvent)

EventRouter.get('/get-event-byId',eventController.getEventById)

EventRouter.get('/update-event',eventController.updateEvent)

module.exports = EventRouter