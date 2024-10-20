const UserModel = require("../models/UserModel")
const EventModel = require("../models/EventModel")
const asyncHandle = require('express-async-handler')
const http = require('http')
require('dotenv').config()



const getAll = asyncHandle( async (req, res) => {
    const allUser = await UserModel.find().populate('idRole')
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:{
            users:allUser
        }
    })
})

const updatePositionUser = asyncHandle( async (req, res) => {
    const {id,lat,lng} = req.body
    const user = await UserModel.findById(id)
    if(!user){
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Người dùng không tồn tại')
    }
    const updateUser = await UserModel.findByIdAndUpdate(id,{position:{lat:lat,lng:lng}},{new:true})
    res.status(200).json({
        status:200,
        message:'Cập nhập position user thành công',
        data:{
            user:updateUser
        }
    })
})

const updateFcmtoken  = asyncHandle( async (req, res) => {
    const {uid,fcmtokens} = req.body
    const updateUser = await UserModel.findByIdAndUpdate(uid,{fcmTokens:fcmtokens},{new:true})
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:{
            fcmTokens:updateUser.fcmTokens ?? [],
        }
    })
})


const getUserById  = asyncHandle( async (req, res) => {
    const {uid} = req.query
    // const Token = await notificationController.getAccessToken()
    // console.log("res",Token)
    if(uid){
        const userDetails = await UserModel.findById(uid)
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:{
                user:userDetails
            }
        })
    }else{
        res.status(401)
        throw new Error('Người dùng không tồn tại')
    }
    
})
const updateProfile  = asyncHandle( async (req, res) => {
    const {fullname,phoneNumber,bio,_id,photoUrl} = req.body
    if(!photoUrl){
        const updateUser = await UserModel.findByIdAndUpdate(_id,{fullname,phoneNumber,bio},{new:true})
        if(updateUser){
            res.status(200).json({
                statusCode:200,
                message:'Cập nhập thành công',
                data:{
                    user:updateUser
                }
            })
        }else{
            res.status(401)
            throw new Error('Cập nhập thông tin không thành công')
        }
    }else{
        const updateUser = await UserModel.findByIdAndUpdate(_id,{photoUrl},{new:true})
        if(updateUser){
            res.status(200).json({
                statusCode:200,
                message:'Cập nhập thành công',
                data:{
                    user:updateUser
                }
            })
        }else{
            res.status(401)
            throw new Error('Cập nhập thông tin không thành công')
        }
    }
    
})

const updateRole  = asyncHandle( async (req, res) => {
    const updateRoleUser = await UserModel.updateMany({},{idRole:'66c523b677cc482c91fcaa61'},{new:true})
    if(updateRoleUser){
        res.status(200).json({
            statusCode:200,
            message:'Cập nhập thành công',
            data:{
                user:updateRoleUser
            }
        })
    }else{
        res.status(401)
        throw new Error('Cập nhập thông tin không thành công')
    }
})

const interestEvent = asyncHandle( async (req, res) => {
    const { idUser, idEvent } = req.body
    const user = await UserModel.findById(idUser)
    const event = await EventModel.findById(idEvent)
    if(user && event){
        const eventsInterestedByUser = [...user.eventsInterested]
        const usersInterestedEvent = [...event.usersInterested]
        const indexEventInterested = eventsInterestedByUser.findIndex(item => item.toString() === idEvent.toString())
        const indexUserInterested = usersInterestedEvent.findIndex(item => item.toString() === idUser.toString())
        if((indexEventInterested !== -1) && (indexUserInterested !== -1)){
            eventsInterestedByUser.splice(indexEventInterested,1)
            usersInterestedEvent.splice(indexUserInterested,1)
            const updateUser = await UserModel.findByIdAndUpdate(idUser,{eventsInterested:eventsInterestedByUser},{new:true})
            const updateEvent = await EventModel.findByIdAndUpdate(idEvent,{usersInterested:usersInterestedEvent},{new:true})
            res.status(200).json({
                status:200,
                message:'Cập nhập thành công',
                data:{
                    user:updateUser,
                    event:updateEvent
                }
            })
        }else{
            eventsInterestedByUser.push(idEvent)
            usersInterestedEvent.push(idUser)
            const updateUser = await UserModel.findByIdAndUpdate(idUser,{eventsInterested:eventsInterestedByUser},{new:true})
            const updateEvent = await EventModel.findByIdAndUpdate(idEvent,{usersInterested:usersInterestedEvent},{new:true})
            res.status(200).json({
                status:200,
                message:'Cập nhập thành công',
                data:{
                    user:updateUser,
                    event:updateEvent
                }
            })
        }

    }else{
        res.status(401)
        throw new Error('Người dùng hoặc sự kiện không tồn tại')
    }
    
})
module.exports = {
    getAll,
    updatePositionUser,
    updateFcmtoken,
    getUserById,
    updateProfile,
    updateRole,
    interestEvent
    
}