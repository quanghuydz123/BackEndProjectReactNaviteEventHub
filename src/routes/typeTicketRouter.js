const express = require('express');
const typeTicketRouter = express.Router();
const typeTicketController = require('../controller/typeTicketController');


typeTicketRouter.get('/get-all',typeTicketController.getAll)
typeTicketRouter.post('/create-typeTicket',typeTicketController.createTypeTicket)
typeTicketRouter.put('/update-statusTypeTicket',typeTicketController.updateStatusTypeTicket)
typeTicketRouter.put('/update-typeTicket',typeTicketController.updateTypeTicket)
typeTicketRouter.delete('/delete-typeTicket',typeTicketController.deleteTypeTicket)

module.exports = typeTicketRouter