const express = require('express');
const EventRouter = express.Router();
const eventController = require('../controller/eventController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');

// EventRouter.post('/add-event',eventController.addEvent)
// EventRouter.get('/get-all',eventController.getAllEvent)
EventRouter.get('/get-events',eventController.getEvents)
// EventRouter.post('/update-followers',eventController.updateFollowerEvent)
EventRouter.get('/get-event-byId',eventController.getEventById)
EventRouter.get('/get-event-byIdForOrganizer',eventController.getEventByIdForOrganizer)

EventRouter.put('/update-event',eventController.updateEvent)
EventRouter.put('/update-statusEvent',eventController.updateStatusEvent)
EventRouter.post('/create-event',eventController.createEvent)
EventRouter.put('/incView-event',eventController.incViewEvent)
EventRouter.get('/get-description-byIdEvent',eventController.getDescriptionEvent)
EventRouter.get('/get-showTimes-byIdEvent',eventController.getShowTimesEvent)
EventRouter.get('/get-showTimes-byIdEventForOrganizer',eventController.getShowTimesEventForOrganizer)

// EventRouter.post('/comment-event',eventController.commentEvent)

module.exports = EventRouter



