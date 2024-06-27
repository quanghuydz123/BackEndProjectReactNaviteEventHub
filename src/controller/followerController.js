const asyncHandle = require('express-async-handler')
require('dotenv').config()
const FollowerModel = require("../models/FollowerModel")



const updateFollowEvent = asyncHandle(async (req, res) => {
    const {idUser,idEvent} = req.body

    const followerEvent = await FollowerModel.findOne({user:idUser})
    if(followerEvent){
        let events = [...followerEvent.events]
        const index = events.findIndex(item => item.toString() === idEvent.toString())
        if(index != -1){
            events.splice(index,1)
            const updateFollowEvent = await FollowerModel.findByIdAndUpdate(followerEvent.id,{events:events},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followerEvent thành công',
                data:{
                    event:updateFollowEvent
                }
                
            })
        }else{
            events.push(idEvent)
            const updateFollowEvent = await FollowerModel.findByIdAndUpdate(followerEvent.id,{events:events},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followerEvent thành công',
                data:{
                    event:updateFollowEvent
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

const getAllFollow = asyncHandle(async (req, res) => {
    const allFollower = await FollowerModel.find()
    .populate({
      path: 'user categories users',
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

const updateFollowCategory = asyncHandle(async (req, res) => {
    const {idUser,idsCategory} = req.body
    const followerCategory = await FollowerModel.findOne({user:idUser})
    if(followerCategory){
        const updateFollowCategory = await FollowerModel.findByIdAndUpdate(followerCategory.id,{categories:idsCategory},{new:true})
        res.status(200).json({
            status:200,
            message:'cập nhập followerCategory thành công',
            data:{
                event:updateFollowCategory
            }
            
        })
    }else{
        res.status(400)
        throw new Error('idUser không tồn tại để update follower')
    }
    
    
})

const getFollowById = asyncHandle(async (req, res) => {
    const {uid} = req.query
    const follower = await FollowerModel.find({user:uid})
    .populate({
      path: 'user categories users',
    })
    .populate({
      path: 'events',
      populate: [
        { path: 'category' },
        { path: 'authorId' },
        { path: 'users' } 
      ]
    });
    const numberOfFollowers = await FollowerModel.find({ users: { $in: [uid] } }).countDocuments();
    if(follower){
        res.status(200).json({
            status:200,
            message:'Lấy follower thành công',
            data:{
                followers:follower,
                numberOfFollowers
            }
        })
    }
    
    
})
const updateFollowUserOther = asyncHandle(async (req, res) => {
    const {idUser,idUserOther} = req.body

    const followerUser = await FollowerModel.findOne({user:idUser})
    if(followerUser){
        let users = [...followerUser.users]
        const index = users.findIndex(item => item.toString() === idUserOther.toString())
        console.log("index",index)
        if(index != -1){
            users.splice(index,1)
            const updateFollowUserOther = await FollowerModel.findByIdAndUpdate(followerUser.id,{users:users},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followUserOther thành công',
                data:{
                    followers:updateFollowUserOther
                }
                
            })
        }else{
            users.push(idUserOther)
            const updateFollowUserOther = await FollowerModel.findByIdAndUpdate(followerUser.id,{users:users},{new:true})
            res.status(200).json({
                status:200,
                message:'cập nhập followerEvent thành công',
                data:{
                    followers:updateFollowUserOther
                }
                
            })
        }
        
    }else{
        const users = []
        users.push(idUserOther)
        const createfollowUserOther = await FollowerModel.create({
            user:idUser,
            users:users
        })
        res.status(200).json({
            status:200,
            message:'thêm mới followUserOther thành công',
            data:{
                followers:createfollowUserOther
            }
            
        })
    }
    
})

module.exports = {
    updateFollowEvent,
    getAllFollow,
    updateFollowCategory,
    getFollowById,
    updateFollowUserOther
}