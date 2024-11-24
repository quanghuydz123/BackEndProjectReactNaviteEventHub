const express = require('express');
const invoiceRouter = express.Router();
const invoiceController = require('../controller/invoiceController');


invoiceRouter.get('/get-all',invoiceController.getAll)
invoiceRouter.post('/create-paymentInvoiceTicket',invoiceController.createPaymentInvoiceTicket)
invoiceRouter.delete('/cancel-invoice',invoiceController.CancelInvoice)
invoiceRouter.get('/get-byIdUser',invoiceController.getByIdUser)

module.exports = invoiceRouter 