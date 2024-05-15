const express = require('express');
const authRouter = express.Router();

authRouter.post('/register',(req,res)=>{
    console.log('req',req.body)
})

module.exports = authRouter