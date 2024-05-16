const UserModel = require("../models/userModel")
const bcrypt = require('bcrypt')
const asyncHandle = require('express-async-handler')
const jwt = require('jsonwebtoken')
const getJsonWebToken = async (email,id) => {
    const payload = {
        email,
        id
    }
    const token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:'7d'})
    return token
}
const register = asyncHandle( async (req, res) => {
    const {email,password,comfirmPassword,username} = req.body
    const existingUser = await UserModel.findOne({email})
    if(existingUser){
        res.status(401)//ngăn không cho xuống dưới
        throw new Error('Email đã được đăng ký!!!')
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new UserModel({
        email,
        fullname:username ?? '',
        password:hashedPassword
    })

    await newUser.save()

    res.status(200).json({
        message: "Đăng ký thành công",
        data:{
            ...newUser,
            accesstoken: await getJsonWebToken(email,newUser.id)
        }
    })
})

module.exports = {
    register
}