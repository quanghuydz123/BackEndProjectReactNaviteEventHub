const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/userController');
const VerifyMiddleware = require('../middlewares/VerifyMiddleware');


userRouter.get('/get-all',userController.getAll)
userRouter.put('/update-position-user',userController.updatePositionUser)
userRouter.post('/update-fcmtoken',userController.updateFcmtoken)
userRouter.get('/get-user-byId',userController.getUserById)
userRouter.put('/update-profile',userController.updateProfile)
userRouter.put('/update-role',userController.updateRole)
userRouter.post('/interest-event',userController.interestEvent)
userRouter.post('/interest-category',userController.interestCategory)
userRouter.get('/get-event-interested-byIdUser',userController.getEventInterestedByIdUser)
userRouter.get('/testSendGmail',userController.testSendGmail)

module.exports = userRouter