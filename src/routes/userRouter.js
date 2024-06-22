const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/userController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');


userRouter.get('/get-all',VerifyMiddleware,userController.getAll)
userRouter.put('/update-position-user',userController.updatePositionUser)
userRouter.post('/update-fcmtoken',userController.updateFcmtoken)

module.exports = userRouter