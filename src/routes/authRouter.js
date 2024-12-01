const express = require('express');
const authRouter = express.Router();
const authController = require('../controller/authController')


authRouter.post('/register',authController.register)
authRouter.post('/login',authController.login)
authRouter.post('/verification',authController.verification)
authRouter.post('/forgotPassword',authController.forgotPassword)
authRouter.post('/verificationForgotPassword',authController.verificationForgotPassword)
authRouter.post('/login-with-google',authController.loginWithGoogle)
authRouter.post('/create-role',authController.createRole)
authRouter.put('/update-role',authController.updateRole)
authRouter.put('/updatePassword',authController.updatePassword)

module.exports = authRouter