const express = require('express');
const EventRouter = express.Router();
const eventController = require('../controller/eventController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');

EventRouter.post('/add-event',eventController.addEvent)
EventRouter.get('/get-all',eventController.getAllEvent)
EventRouter.get('/get-events',eventController.getEvents)
EventRouter.post('/update-followers',eventController.updateFollowerEvent)
EventRouter.get('/get-event-byId',eventController.getEventById)
EventRouter.put('/update-event',eventController.updateEvent)
EventRouter.put('/update-statusEvent',eventController.updateStatusEvent)
EventRouter.post('/create-event',eventController.createEvent)
EventRouter.put('/incView-event',eventController.incViewEvent)
EventRouter.post('/comment-event',eventController.commentEvent)

module.exports = EventRouter



