const UserModel = require("../models/UserModel")
const asyncHandle = require('express-async-handler')
require('dotenv').config()



const getAll = asyncHandle( async (req, res) => {
    const allUser = await UserModel.find()
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
            user:updateUser
        }
    })
})

const getUserById  = asyncHandle( async (req, res) => {
    const {uid} = req.query
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
module.exports = {
    getAll,
    updatePositionUser,
    updateFcmtoken,
    getUserById,
    updateProfile
}