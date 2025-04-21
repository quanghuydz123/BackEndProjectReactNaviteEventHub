const express = require('express');
const promotionRouter = express.Router();
const promotionController = require('../controller/promotionController');


promotionRouter.get('/get-all',promotionController.getAll)
promotionRouter.get('/get-by-idEvent',promotionController.getByIdEvent)

promotionRouter.post('/create-promotion',promotionController.createPromotion)
promotionRouter.put('/update-promotion',promotionController.updatePromotion)
promotionRouter.put('/cancel-promotion',promotionController.cancelPromotion)

module.exports = promotionRouter 