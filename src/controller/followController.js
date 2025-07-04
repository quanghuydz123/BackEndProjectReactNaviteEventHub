const asyncHandle = require('express-async-handler')
require('dotenv').config()
const FollowModel = require("../models/FollowModel")
const UserModel = require("../models/UserModel")
const NotificationModel = require("../models/NotificationModel")
const notificationController = require('./notificationController');


const updateFollowEvent = asyncHandle(async (req, res) => {
    const { idUser, idEvent } = req.body

    const followerEvent = await FollowModel.findOne({ user: idUser })
    if (followerEvent) {
        let events = [...followerEvent.events]
        const index = events.findIndex(item => item.toString() === idEvent.toString())
        if (index != -1) {
            events.splice(index, 1)
            const updateFollowEvent = await FollowModel.findByIdAndUpdate(followerEvent.id, { events: events }, { new: true })
            res.status(200).json({
                status: 200,
                message: 'cập nhập followerEvent thành công',
                data: {
                    event: updateFollowEvent
                }

            })
        } else {
            events.push(idEvent)
            const updateFollowEvent = await FollowModel.findByIdAndUpdate(followerEvent.id, { events: events }, { new: true })
            res.status(200).json({
                status: 200,
                message: 'cập nhập followerEvent thành công',
                data: {
                    event: updateFollowEvent
                }

            })
        }

    } else {
        const events = []
        events.push(idEvent)
        const createFollowerEvent = await FollowModel.create({
            user: idUser,
            events: events
        })
        res.status(200).json({
            status: 200,
            message: 'thêm mới followerEvent thành công',
            data: {
                event: createFollowerEvent
            }

        })
    }

})

const getAllFollow = asyncHandle(async (req, res) => {
    const allFollower = await FollowModel.find()
        .populate({
            path: 'user users.idUser',
        })
        // .populate({
        //     path: 'events',
        //     populate: [
        //         { path: 'category' },
        //         { path: 'authorId' },
        //         { path: 'users' }
        //     ]
        // });
    res.status(200).json({
        status: 200,
        message: 'Lấy allFollower thành công',
        data: {
            followers: allFollower
        }
    })

})

const updateFollowCategory = asyncHandle(async (req, res) => {
    const { idUser, idsCategory } = req.body
    const followerCategory = await FollowModel.findOne({ user: idUser })
    if (followerCategory) {
        const updateFollowCategory = await FollowModel.findByIdAndUpdate(followerCategory.id, { categories: idsCategory }, { new: true })
        res.status(200).json({
            status: 200,
            message: 'cập nhập followerCategory thành công',
            data: {
                event: updateFollowCategory
            }

        })
    } else {
        res.status(400)
        throw new Error('idUser không tồn tại để update follower')
    }


})

const getFollowById = asyncHandle(async (req, res) => {
    const { uid } = req.query
    const follower = await FollowModel.find({ user: uid })
        .populate({
            path: 'user users.idUser',
            select:'_id fullname email photoUrl bio numberOfFollowing numberOfFollowers'
        })
    const numberOfFollowers = await FollowModel.find({
        users: {
            $elemMatch: {
                idUser: uid,
            }
        }
    }).countDocuments();
    const yourFollowers = await FollowModel.find({
        users: {
            $elemMatch: {
                idUser: uid,
            }
        }
    }).populate('user users.idUser', '_id fullname email photoUrl bio numberOfFollowing numberOfFollowers');
    if (follower) {
        res.status(200).json({
            status: 200,
            message: 'Lấy follower thành công',
            data: {
                followers: follower,
                numberOfFollowers,
                yourFollowers
            }
        })
    }


})
const updateFollowUserOther = asyncHandle(async (req, res) => {
    const { idUser, idUserOther } = req.body
    const followerUser = await FollowModel.findOne({ user: idUser })
    if (followerUser) {
        let users = [...followerUser.users]
        const index = users.findIndex(item => item.idUser.toString() === idUserOther.toString())
        if (index != -1) {
            // const idNotification = users.find((item) => item.idUser.toString() === idUserOther.toString()).idNotification
            users.splice(index, 1)
            const updateFollowUserOther = await FollowModel.findByIdAndUpdate(followerUser.id, { users: users }, { new: true })
            await UserModel.findByIdAndUpdate(idUser,{$inc:{numberOfFollowing:-1}})
            await UserModel.findByIdAndUpdate(idUserOther,{$inc:{numberOfFollowers:-1}})
            // await NotificationModel.findByIdAndUpdate(idNotification, { status: 'cancelled' }, { new: true })
            res.status(200).json({
                status: 200,
                message: 'cập nhập followUserOther thành công',
                data: null

            })
        } else {

            await NotificationModel.create({
                senderID: idUser,
                recipientId: idUserOther,
                type: 'follow',
                content: `vừa mới theo dõi bạn !!!`,
                status: 'unanswered',
                isRead: false
            })
            // users.push({ idUser: idUserOther, idNotification: createNotification.id,status:true })
            users.push({ idUser: idUserOther})
            await FollowModel.findByIdAndUpdate(followerUser.id, { users: users }, { new: true })
            await UserModel.findByIdAndUpdate(idUser,{$inc:{numberOfFollowing:1}})
            await UserModel.findByIdAndUpdate(idUserOther,{$inc:{numberOfFollowers:1}})
            const user = await UserModel.findById(idUser)
            const userOther = await UserModel.findById(idUserOther)
            const fcmTokens = userOther.fcmTokens
            if (fcmTokens.length > 0) {
                await Promise.all(fcmTokens.map(async (fcmToken) =>
                    await notificationController.handleSendNotification({
                        fcmToken: fcmToken,
                        title: 'Thông báo',
                        subtitle: '',
                        body: `${user.fullname} vừa mới dõi bạn theo dõi`,
                        data: {
                            type:'following'
                        }
                    }))
                )
            }

            res.status(200).json({
                status: 200,
                message: 'cập nhập followerEvent thành công',
                data: null

            })
        }

    } else {
        const users = []
        await NotificationModel.create({
            senderID: idUser,
            recipientId: idUserOther,
            type: 'follow',
            content: `vừa mới theo dõi bạn !!!`,
            status: 'unanswered',
            isRead: false
        })
        users.push({ idUser: idUserOther})
        await FollowModel.create({
            user: idUser,
            users: users
        })
        await UserModel.findByIdAndUpdate(idUser,{$inc:{numberOfFollowing:1}})
        await UserModel.findByIdAndUpdate(idUserOther,{$inc:{numberOfFollowers:1}})
        const user = await UserModel.findById(idUser)
        const userOther = await UserModel.findById(idUserOther)
        const fcmTokens = userOther.fcmTokens
        if (fcmTokens.length > 0) {
            await Promise.all(fcmTokens.map(async (fcmToken) =>
                await notificationController.handleSendNotification({
                    fcmToken: fcmToken,
                    title: 'Thông báo',
                    subtitle: '',
                    body: `${user.fullname} đã dõi bạn theo dõi`,
                    data: {
                        type:'following'
                    }
                }))
            )
        }

        res.status(200).json({
            status: 200,
            message: 'thêm mới followUserOther thành công',
            data: null

        })
    }

})


const getNumberFollow = asyncHandle(async (req, res) => {
    const allFollower = await FollowModel.find()
    Promise.all((allFollower.map(async (item)=>{
        const follow = await FollowModel.findOne({user:item.user})
        const numberOfFollowers = await FollowModel.find({
            users: {
                $elemMatch: {
                    idUser: item.user,
                }
            }
        }).countDocuments();
        const numberOfFollowing = follow.users.length
        const userUpdate = await UserModel.findByIdAndUpdate(item.user,{numberOfFollowing:numberOfFollowing,numberOfFollowers:numberOfFollowers})
        console.log("numberOfFollowers",item.user,numberOfFollowers,numberOfFollowing)
    })))
    res.status(200).json({
        status: 200,
        message: 'Lấy allFollower thành công',
        data: allFollower})
    })

const test = asyncHandle(async (req, res) => {
    // const { showTimes, event, idUser } = req.body
    // if(!showTimes  || showTimes.length === 0  || !event || !idUser){
    //     return res.status(404).json({
    //         status: 404,
    //         message: 'Hãy nhập đầy đủ thông tin',
    //     })
    // }
    const {idUser} = req.query
    const follow = await FollowModel.find({
        users: {
            $elemMatch: {
                idUser: idUser,
            }
        }
    }).select('user').populate('user','fcmTokens');

    const usersFollowing = follow.flatMap(item => item.user._id);
    const fcmTokens = follow.flatMap(item => item.user.fcmTokens);
    const uniqueFcmTokens = [...new Set(fcmTokens)];

    if (uniqueFcmTokens.length > 0) {
        await Promise.all(uniqueFcmTokens.map(async (fcmToken) =>
            await notificationController.handleSendNotification({
                fcmToken: 'dF7zw68sTU2c5OZIZu9xiF:APA91bFsocHIL_hljO_ekx9jsCm4Gu8hEdXVGcc6DFMBzf_Ck9lR1hu8yfvj6IQGcSxbkDWS_Canfj7uvoiAEL_2DOWgRlqDVcZ1OLbYbHr6Za-nQaXoyMaQJyL8WKppTrwxdKsO0x_O',
                title: 'Thông báo',
                subtitle: '',
                body: `VieON đã tổ chức sự kiện "ANH TRAI "SAY HI" HÀ NỘI - CONCERT 4 " hãy xem ngay nào !!!`,
                image:'https://firebasestorage.googleapis.com/v0/b/eventapp-1cfef.appspot.com/o/images%2Fiamge1.jpg61533e52-0c3e-4047-b551-d2a852665bf4?alt=media&token=9c74e5ce-3e4e-4ddc-a33e-767f265d7efb',
                data: {
                    id: 'idEvent',
                    type:'NewEvent'
                  }
            }))
        )
    }
    return res.status(200).json({
        status: 200,
        message: 'Lấy allFollower thành công',
        data:uniqueFcmTokens,
        usersFollowing
    })
    })

module.exports = {
    updateFollowEvent,
    getAllFollow,
    updateFollowCategory,
    getFollowById,
    updateFollowUserOther,
    getNumberFollow,
    test

}