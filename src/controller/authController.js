const UserModel = require("../models/UserModel")
const bcrypt = require('bcrypt')
const asyncHandle = require('express-async-handler')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer");
const EmailService = require('../service/EmailService')
require('dotenv').config()

//asyncHandle có xử lý đến fontend
const getJsonWebToken = async (email,id,isAdmin) => {
    const payload = {
        email,
        id,
        isAdmin
    }
    const token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:'7d'})
    return token
}

const register = asyncHandle( async (req, res) => {
    const {email,password,comfirmPassword,username} = req.body
    const existingUser = await UserModel.findOne({email})
    if(existingUser){
        res.status(402)//ngăn không cho xuống dưới
        throw new Error('Email đã được đăng ký!!!')
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new UserModel({
        email,
        fullname:username || 'Người dùng',
        password:hashedPassword,
        isAdmin:false
    })

    await newUser.save()

    res.status(200).json({
        statusCode:200,
        message: "Đăng ký thành công",
        data:{
            email:newUser.email,
            id:newUser.id,
            fullname:newUser.fullname,
            accesstoken: await getJsonWebToken(email,newUser.id,newUser.isAdmin)
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
            fullname:existingUser?.fullname,
            isAdmin:existingUser.isAdmin,
            photoUrl:existingUser?.photoUrl,
            accesstoken: await getJsonWebToken(existingUser.email,existingUser.id,existingUser.isAdmin)
        }
    })
})

  

const verification = asyncHandle(async(req,res)=>{
    const {email} = req.body
    const existingUser = await UserModel.findOne({email})
    if(existingUser){
        res.status(402)//ngăn không cho xuống dưới
        throw new Error('Email đã được đăng ký!!!')
    }
    const verificationCode = Math.round(1000 + Math.random() * 9000)
    try {
        await EmailService.handleSendMail(verificationCode,email)
        res.status(200).json({
            message:'Gửi verficationCode thành công',
            data:{
                code: verificationCode  
            }
        })
    } catch (error) {
        res.status(401)
        throw new Error('Không thể gửi verificationCode đến email')
    }
})


const verificationForgotPassword = asyncHandle(async(req,res)=>{
    const {email} = req.body
    const existingUser = await UserModel.findOne({email})
    if(!existingUser){
        res.status(402)//ngăn không cho xuống dưới
        throw new Error('Email chưa được đăng ký!!!')
    }
    const verificationCode = Math.round(1000 + Math.random() * 9000)
    try {
        await EmailService.handleSendMail(verificationCode,email)
        res.status(200).json({
            message:'Gửi verficationCode thành công',
            data:{
                code: verificationCode  
            }
        })
    } catch (error) {
        res.status(401)
        throw new Error('Không thể gửi verificationCode đến email')
    }
})

const forgotPassword = asyncHandle(async(req,res)=>{
    const {email,password,comfirmPassword} = req.body
    const existingUser = await UserModel.findOne({email})
    if(!existingUser){
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Email chưa được đăng ký!!!')
    }
    if(password !== comfirmPassword){
        res.status(401)//ngăn không cho xuống dưới
        throw new Error('Mật khẩu nhập lại không chính xác!!!')
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const updateUser = await UserModel.findByIdAndUpdate(existingUser.id,{password:hashedPassword},{new:true})
    res.status(200).json({
        message:'Đổi mật khẩu thành công',
        data:{
            code: updateUser  
        }
    })
})
module.exports = {
    register,
    login,
    verification,
    forgotPassword,
    verificationForgotPassword
}