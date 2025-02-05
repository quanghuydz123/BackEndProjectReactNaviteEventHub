const UserModel = require("../models/UserModel")
const bcrypt = require('bcrypt')
const asyncHandle = require('express-async-handler')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer");
const EmailService = require('../service/EmailService')
require('dotenv').config()
const RoleModel = require("../models/RoleModel")
const FollowModel = require("../models/FollowModel")
const InVoiceModel = require('../models/InVoiceModel')
const TicketModel = require('../models/TicketModel')   
//asyncHandle có xử lý đến fontend
const getJsonWebToken = async (email,id,key,name) => {
    const payload = {
        email,
        id,
        role:{
            key,
            name
        }
    }
    const token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:'7d'})
    return token
}
const validateEmail = (mail)=>{
    if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)){
        return true
    }
    return false
}
const register = asyncHandle( async (req, res) => {
    const {email,password,comfirmPassword,username} = req.body
    if(!email || !password || !comfirmPassword){
        return res.status(402).json({
            status:402,
            message: "Hãy nhập đầy đủ thông tin",
        })
    }
    const existingUser = await UserModel.findOne({email})
    if(!validateEmail(email)){
        return res.status(402).json({
            status:402,
            message: "Email không đúng định đạng",
        })
    }
    if(password !== comfirmPassword){
        return res.status(402).json({
            status:402,
            message: "Mật khẩu nhập lại không đúng",
        })
    }
    if(existingUser){
        return res.status(402).json({
            status:402,
            message: "Email đã được đăng ký!!!",
        })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new UserModel({
        email,
        fullname:username || 'Người dùng',
        password:hashedPassword,
        idRole:'66c523b677cc482c91fcaa61'
    })
    await newUser.save()
    res.status(200).json({
        status:200,
        message: "Đăng ký thành công",
        data:{
            email:newUser.email,
            id:newUser.id,
            fullname:newUser.fullname,
            accesstoken: await getJsonWebToken(email,newUser.id,newUser.idRole.key,newUser.idRole.name)
        }
    })
})
const getInvoiceByIdUser = asyncHandle(async (idUser) => {
    const invoices = await InVoiceModel.find({user:idUser})
    .select('-address -fullname -email -paymentMethod -phoneNumber -fullAddress -updatedAt -__v')
    .sort({createdAt:-1})

    const groupedInvoices = {};

    for (const invoice of invoices) {
        const ticket = await TicketModel.findOne({ invoice: invoice._id }).populate({
            path: 'event',
            select: '_id title',
        });

        const monthYear =
            'Tháng ' +
            new Date(invoice.createdAt).toLocaleString('en-US', { month: '2-digit', year: 'numeric' });

        const titleEvent = 'Mua vé sự kiện ' + (ticket?.event?.title || '');
        // const titleEventCopy = cleanString(titleEvent);
        // if (!regex.test(titleEventCopy)) return; // Bỏ qua nếu không khớp

        const invoiceData = {
            ...invoice.toObject(),
            titleEvent,
        };

        if (!groupedInvoices[monthYear]) {
            groupedInvoices[monthYear] = [];
        }
        groupedInvoices[monthYear].push(invoiceData);
    }
    const result = Object.values(groupedInvoices);
    return result

   
})

const login = asyncHandle(async (req,res)=>{
    const {email,password} = req.body
    const existingUser = await UserModel.findOne({email}).populate('idRole').populate({
        path: 'categoriesInterested.category',
        select: '_id name image'
    })
    .populate({
        path: 'viewedEvents.event',
        select:'-description -authorId -uniqueViewCount -uniqueViewRecord -viewRecord',
        populate:[{
            path:'category',
            select:'_id name image',

        },
        {
            path:'usersInterested.user',
            select:'_id fullname email photoUrl',
        },
        {
            path:'showTimes',
            options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
            populate:{
                path:'typeTickets',
                select:'price type',
                options: { sort: { price: -1 } }, // Sắp xếp thei
            }
        }
    ]
    })
    .select('-categoriesInterested.createdAt -categoriesInterested._id -viewedEvents.createdAt -viewedEvents._id -createdAt -updatedAt');
    if(!existingUser){
        res.status(200).json({  
            message:"Email chưa được đăng ký!!!",
            statusCode:'ERR',
        })
    }
    if(!existingUser.password){
        return res.status(403).json({
            message:"Tài khoản của bạn đã đăng ký bằng Google vui lòng vào cài đặt cập nhập mật khẩu để đăng nhập bằng cách này",
            status:403,
        })
    }
    const isMathPassword = await bcrypt.compare(password,existingUser.password)
    if(!isMathPassword){
        res.status(403)//ngăn không cho xuống dưới
        throw new Error('Email hoặc mật khẩu không chỉnh xác!!!')
    }
    existingUser?.viewedEvents.forEach(item => {//sap xếp các suất diễn đã kết thúc xuống cuối
        item.event.showTimes = [
            ...item.event.showTimes.filter(showTime => showTime.status !== 'Ended'),
            ...item.event.showTimes.filter(showTime => showTime.status === 'Ended')
        ];
    });
    // const sortedStartEvents = existingUser?.viewedEvents.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
    //     const dateA = a.event.showTimes[0]?.startDate ? new Date(a.event.showTimes[0].startDate) : new Date(0);
    //     const dateB = b.event.showTimes[0]?.startDate ? new Date(b.event.showTimes[0].startDate) : new Date(0);
    //     //dateB - dateA giảm dần
    //     return dateA - dateB;
    // }); 
    const follow = await FollowModel.findOne({user:existingUser._id})
    res.status(200).json({
        message:"Đăng nhập thành công",
        status:200,
        data:{
            id:existingUser.id,
            email:existingUser.email,
            fullname:existingUser?.fullname,
            photoUrl:existingUser?.photoUrl,
            accesstoken: await getJsonWebToken(existingUser.email,existingUser.id,existingUser.idRole.key,existingUser.idRole.name),    
            fcmTokens:existingUser.fcmTokens ?? [],
            phoneNumber:existingUser.phoneNumber,
            role:existingUser.idRole,
            bio:existingUser.bio,
            eventsInterested:existingUser.eventsInterested ?? [],
            categoriesInterested:existingUser?.categoriesInterested ?? [],
            viewedEvents:existingUser.viewedEvents,
            numberOfFollowers:existingUser.numberOfFollowers,
            numberOfFollowing:existingUser.numberOfFollowing,
            follow:follow ?? {
                _id:'',
                user:'',
                users:[]
            },
            position:existingUser?.position,
            address:existingUser?.address,
            invoices:await getInvoiceByIdUser(existingUser.id) ?? [],
            searchHistory:existingUser?.searchHistory ?? [],
            totalCoins:existingUser.totalCoins,
            IsDailyCheck:existingUser.IsDailyCheck,
            lastCheckIn:existingUser.lastCheckIn


        }
    })
})

const loginWithGoogle = asyncHandle(async (req,res)=>{
   const userInfo = req.body
   await UserModel.findOneAndUpdate({email:userInfo.email},{googleId:userInfo.id})
   const existingUser = await UserModel.findOne({email:userInfo.email}).populate('idRole').populate({
    path: 'categoriesInterested.category',
    select: '_id name image'
    })
    .populate({
        path: 'viewedEvents.event',
        select:'-description -authorId -uniqueViewCount -uniqueViewRecord -viewRecord',
        populate:[{
            path:'category',
            select:'_id name image',

        },
        {
            path:'usersInterested.user',
            select:'_id fullname email photoUrl',
        },
        {
            path:'showTimes',
            options: { sort: { startDate: 1 } }, // Sắp xếp theo startDate tăng dần
            populate:{
                path:'typeTickets',
                select:'price type',
                options: { sort: { price: -1 } }, // Sắp xếp thei
            }
        }
    ]
    })
    .select('-categoriesInterested.createdAt -categoriesInterested._id -viewedEvents.createdAt -viewedEvents._id -createdAt -updatedAt');
   if(existingUser){
    existingUser?.viewedEvents.forEach(item => {//sap xếp các suất diễn đã kết thúc xuống cuối
        item.event.showTimes = [
            ...item.event.showTimes.filter(showTime => showTime.status !== 'Ended'),
            ...item.event.showTimes.filter(showTime => showTime.status === 'Ended')
        ];
    });
    const follow = await FollowModel.findOne({user:existingUser._id})
    res.status(200).json({
        message:"Đăng nhập thành công",
        status:200,
        data:{
            id:existingUser.id,
            email:existingUser.email,
            fullname:existingUser?.fullname,
            photoUrl:existingUser?.photoUrl,
            accesstoken: await getJsonWebToken(existingUser.email,existingUser.id,existingUser.idRole.key,existingUser.idRole.name),    
            fcmTokens:existingUser.fcmTokens ?? [],
            phoneNumber:existingUser.phoneNumber,
            role:existingUser?.idRole,
            bio:existingUser.bio,
            eventsInterested:existingUser.eventsInterested ?? [],
            categoriesInterested:existingUser?.categoriesInterested ?? [],
            viewedEvents:existingUser.viewedEvents,
            numberOfFollowers:existingUser.numberOfFollowers,
            numberOfFollowing:existingUser.numberOfFollowing,
            follow:follow ?? {
                _id:'',
                user:'',
                users:[]
            },
            position:existingUser?.position,
            address:existingUser?.address,
            invoices:await getInvoiceByIdUser(existingUser.id) ?? [],
            isHasPassword:existingUser.password ? true : false,
            searchHistory:existingUser?.searchHistory ?? [],
            totalCoins:existingUser.totalCoins,
            IsDailyCheck:existingUser.IsDailyCheck,
            lastCheckIn:existingUser.lastCheckIn

        }
    })
   }else{
    const newUser = new UserModel({
        email:userInfo.email,
        fullname:userInfo.name,
        photoUrl:userInfo.photo,
        idRole:'66c523b677cc482c91fcaa61',
        googleId:userInfo.id
    })
    await newUser.save()
    res.status(200).json({
        message:"Đăng nhập thành công",
        status:200,
        data:{
            id:newUser.id,
            email:newUser.email,
            fullname:newUser?.fullname,
            photoUrl:newUser?.photoUrl,
            accesstoken: await getJsonWebToken(newUser.email,newUser.id,newUser.idRole.key,newUser.idRole.name),    
            fcmTokens:newUser.fcmTokens ?? [],
            phoneNumber:newUser.phoneNumber,
            role:newUser?.idRole,
            bio:newUser.bio,
            eventsInterested:newUser.eventsInterested ?? [],
            categoriesInterested:newUser?.categoriesInterested ?? [],
            viewedEvents:[],
            numberOfFollowers:0,
            numberOfFollowing:0,
            follow:{
                _id:'',
                user:'',
                users:[]
            },
            invoices:[],
            searchHistory:[],
            totalCoins:0,
            IsDailyCheck:false,
            lastCheckIn:-1
        }
    })

   }
})

const verification = asyncHandle(async(req,res)=>{
    const {email,password,comfirmPassword} = req.body
    if(!email || !password || !comfirmPassword){
        return res.status(402).json({
            status:402,
            message: "Hãy nhập đầy đủ thông tin",
        })
    }
    const existingUser = await UserModel.findOne({email})
    if(!validateEmail(email)){
        return res.status(402).json({
            status:402,
            message: "Email không đúng định đạng",
        })
    }
    if(password.length < 6){
        return res.status(402).json({
            status:402,
            message: "Mật khẩu phải có 6 ký tự trở lên",
        })
    }
    if(password !== comfirmPassword){
        return res.status(402).json({
            status:402,
            message: "Mật khẩu nhập lại không đúng",
        })
    }
    if(existingUser){
        res.status(402)//ngăn không cho xuống dưới
        throw new Error('Email đã được đăng ký!!!')
    }
    const verificationCode = Math.round(1000 + Math.random() * 9000)
    try {
        await EmailService.handleSendMail(verificationCode,email)
        return res.status(200).json({
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
    if(!validateEmail(email)){
        return res.status(402).json({
            status:402,
            message: "Email không đúng định đạng",
        })
    }
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
    if(password.length < 6){
        res.status(401)//ngăn không cho xuống dưới
        throw new Error('Mật khẩu phải có 6 ký tự trở lên')
    }
    if(password !== comfirmPassword){
        res.status(401)//ngăn không cho xuống dưới
        throw new Error('Mật khẩu nhập lại không chính xác!!!')
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const updateUser = await UserModel.findByIdAndUpdate(existingUser.id,{password:hashedPassword},{new:true})
    res.status(200).json({
        status:200,
        message:'Đổi mật khẩu thành công',
        data:{
            code: updateUser  
        }
    })
})

const createRole = asyncHandle(async(req,res)=>{
    const {key,name} = req.body
    const createRole = await RoleModel.create({
        key,
        name
    })
    res.status(200).json({
        status: 200,
        message: 'thêm mới role thành công',
        data: {
            role:createRole
        }

    })
})

const updateRole = asyncHandle(async(req,res)=>{
    const {key,name} = req.body
    const createRole = await RoleModel.create({
        key,
        name
    })
    res.status(200).json({
        status: 200,
        message: 'thêm mới role thành công',
        data: {
            role:createRole
        }

    })
})
const updatePassword = asyncHandle(async (req, res) => {
    const {passwordCurrent,password,comfirmPassword,type,idUser} = req.body
    try {
        if(password.length < 6){
            return res.status(400).json({
                status: 400,
                message: 'Mật khẩu phải có 6 ký tự trở lên!!!',
                
            })
        }
        if(password !== comfirmPassword){
            return res.status(400).json({
                status: 400,
                message: 'Mật khẩu nhập lại không chính xác!!!',
                
            })
        }
        const user = await UserModel.findById(idUser)
        if(!user){
            return res.status(400).json({
                status: 400,
                message: 'Người dùng không tòn tại!!!',
                
            })
        }
        if(type==='changePassword'){
            if(!user.password){
                return res.status(400).json({
                    status: 400,
                    message: 'Bạn chưa cập nhập mật khẩu cho tài khoản này!!!'
                })
            }
            const isMathPassword = await bcrypt.compare(passwordCurrent,user.password)
            if(!isMathPassword){
                return res.status(400).json({
                    status: 400,
                    message: 'Mật khẩu hiện tại không chính xác!!!'
                })
            }
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const userUpdate = await UserModel.findByIdAndUpdate(idUser,{password:hashedPassword},{new:true})
            return res.status(200).json({
                status: 200,
                message: 'Đổi mật khẩu thành công!!!',
                data:userUpdate
            })
        }
        else
        {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const userUpdate = await UserModel.findByIdAndUpdate(idUser,{password:hashedPassword})
            return res.status(200).json({
                status: 200,
                message: 'Cập nhập mật khẩu thành công!!!',
                data:userUpdate
            })
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error,
            
        })
    }
   
})
module.exports = {
    register,
    login,
    verification,
    forgotPassword,
    verificationForgotPassword,
    loginWithGoogle,
    createRole,
    updateRole,
    updatePassword
}