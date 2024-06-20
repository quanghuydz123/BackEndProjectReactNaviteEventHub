const asyncHandle = require('express-async-handler')
require('dotenv').config()
const FollowerModel = require("../models/FollowerModel")



const updateFollowerEvent = asyncHandle(async (req, res) => {
    const {idUser,idEvent} = req.body

    const followerEvent = await FollowerModel.findOne({user:idUser})
    if(followerEvent){
        let events = [...followerEvent.events]
        const index = events.findIndex(item => item.toString() === idEvent.toString())
        if(index != -1){
            events.splice(index,1)
            const updateFollowerEvent = await FollowerModel.findByIdAndUpdate(followerEvent.id,{events:events},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followerEvent thành công',
                data:{
                    event:updateFollowerEvent
                }
                
            })
        }else{
            events.push(idEvent)
            const updateFollowerEvent = await FollowerModel.findByIdAndUpdate(followerEvent.id,{events:events},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followerEvent thành công',
                data:{
                    event:updateFollowerEvent
                }
                
            })
        }
        
    }else{
        const events = []
        events.push(idEvent)
        const createFollowerEvent = await FollowerModel.create({
            user:idUser,
            events:events
        })
        res.status(200).json({
            status:200,
            message:'thêm mới followerEvent thành công',
            data:{
                event:createFollowerEvent
            }
            
        })
    }
    
})

const getAllFollower = asyncHandle(async (req, res) => {
    const allFollower = await FollowerModel.find()
    .populate({
      path: 'user',
    })
    .populate({
      path: 'events',
      populate: [
        { path: 'category' },
        { path: 'authorId' },
        { path: 'users' } 
      ]
    });
    res.status(200).json({
        status:200,
        message:'Lấy allFollower thành công',
        data:{
            followers:allFollower
        }
    })
    
})
module.exports = {
    updateFollowerEvent,
    getAllFollower
}