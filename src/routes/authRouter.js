const express = require('express');
const authRouter = express.Router();
const authController = require('../controller/authController')


authRouter.post('/register',authController.register)
authRouter.post('/login',authController.login)
authRouter.post('/verification',authController.verification)
authRouter.post('/forgotPassword',authController.forgotPassword)
authRouter.post('/verificationForgotPassword',authController.verificationForgotPassword)

module.exports = authRouter