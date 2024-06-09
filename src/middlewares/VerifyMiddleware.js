const jwt = require('jsonwebtoken')
const asyncHandle = require('express-async-handler')
const VerifyMiddleware = asyncHandle((req,res,next)=>{
    const accessToken = req.headers.authorization
    const token = accessToken && accessToken.split(' ')[1]
    if(!token) {
        res.status(401)
        throw new Error('Xác thực thất bại')
    }else{
        const verify = jwt.verify(token,process.env.SECRET_KEY)
        if(verify){
            next()
        }else{
            res.status(403)
            throw new Error('Xác thực thất bại')
        }
    }   
})

module.exports = VerifyMiddleware