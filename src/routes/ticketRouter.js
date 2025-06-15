const express = require('express');
const ticketRouter = express.Router();
const ticketController = require('../controller/ticketController');

ticketRouter.get('/get-all', ticketController.getAll);
ticketRouter.post('/reserve-ticket', ticketController.reserveTicket);
ticketRouter.get('/get-byIdUser', ticketController.getByIdUser);
ticketRouter.get('/get-byIdInvoice', ticketController.getByIdInvoice);
ticketRouter.get(
  '/get-sales-summary-byIdShowTime',
  ticketController.getSalesSumaryByIdShowTime
);
// ticketRouter.get('/statistical-checkinByIdShowTime',ticketController.statisticalCheckinByIdShowTime)
ticketRouter.get('/get-byIdShowTime', ticketController.getByIdShowTime);
ticketRouter.get('/get-sales-charts', ticketController.getSalesCharts);
ticketRouter.get('/share-ticket', ticketController.shareTicket);

module.exports = ticketRouter;
