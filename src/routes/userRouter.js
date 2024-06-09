const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/userController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');


userRouter.get('/get-all',VerifyMiddleware,userController.getAll)

module.exports = userRouter