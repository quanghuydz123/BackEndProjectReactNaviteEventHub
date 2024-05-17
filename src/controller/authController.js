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
    if(password !== comfirmPassword){
        res.status(401)//ngăn không cho xuống dưới
        throw new Error('Mật khẩu nhập lại không giống nhau!!!')
    }
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
        statusCode:200,
        message: "Đăng ký thành công",
        data:{
            email:newUser.email,
            id:newUser.id,
            fullname:newUser.fullname,
            accesstoken: await getJsonWebToken(email,newUser.id)
        }
    })
})
const login = asyncHandle(async (req,res)=>{
    const {email,password} = req.body
    const existingUser = await UserModel.findOne({email})
    if(!existingUser){
        res.status(200).json({
            message:"Email chưa được đăng ký!!!",
            statusCode:'ERR',
        })
    }
    const isMathPassword = await bcrypt.compare(password,existingUser.password)
    if(!isMathPassword){
        res.status(403)//ngăn không cho xuống dưới
        throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
    }
    res.status(200).json({
        message:"Đăng nhập thành công",
        statusCode:200,
        data:{
            id:existingUser.id,
            email:existingUser.email,
            accesstoken: await getJsonWebToken(existingUser.email,existingUser.id)
        }
    })
})
module.exports = {
    register,
    login
}