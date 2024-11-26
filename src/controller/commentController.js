const CommentModel = require('../models/CommentModel')
const EventModel = require('../models/EventModel')
const UserModel = require('../models/UserModel')
const {mongoose } = require('mongoose');

const asyncHandle = require("express-async-handler");

const commentEvent = asyncHandle(async (req, res) => {
    const {idUser,idEvent,content} = req.body
    try {
        if(!idUser || !idEvent || !content){
            res.status(400)
            throw new Error('Thiếu thông tin để thêm bình luận')
        }
        const checkEvent = await EventModel.findById(idEvent)
        if(!checkEvent){
            res.status(404)
            throw new Error('idEvent không hợp lệ')
        }
        const checkUser = await UserModel.findById(idUser)
        if(!checkUser){
            res.status(404)
            throw new Error('idUser không hợp lệ')
        }
        const commentNew = new CommentModel({
            user:idUser,
            event:idEvent,
            content:content
        })
        const data = await commentNew.save()
        await EventModel.findByIdAndUpdate(checkEvent._id,{$inc:{totalComments:1}})
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:data
        })
    } catch (error) {
        res.status(500)
        throw new Error(error || 'Đã xảy ra lỗi commentEvent')
    }
})


const replyCommentEvent = asyncHandle(async (req, res) => {
    const {idUserReply,idComment,content,idEvent} = req.body
   try {
    const checkUser = await UserModel.findById(idUserReply)
    if(!checkUser){
        res.status(404)
        throw new Error('idUser không hợp lệ')
    }
    const checkComment = await CommentModel.findById(idComment)
    if(!checkComment){
        res.status(404)
        throw new Error('idComment không hợp lệ')
    }
    const checkEvent = await EventModel.findById(idEvent)
    if(!checkEvent){
        res.status(404)
        throw new Error('idEvent không hợp lệ')
    }
    const commentReply = {
        user: checkUser._id,
        content: content,
    }
    const commentUpdate = await CommentModel.findByIdAndUpdate(
        idComment,
        { $push: { replyComment: commentReply }, $inc:{replyCommentCount:1} },
        { new: true }
    );
    await EventModel.findByIdAndUpdate(checkEvent._id,{$inc:{totalComments:1}})
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:commentUpdate
    })
   } catch (error) {
        res.status(500)
        throw new Error(error || 'Đã xảy ra lỗi replyCommentEvent')
   }
})

const getByIdEvent = asyncHandle(async (req, res) => {
    const {idEvent,idUser} = req.query
    if(!idUser){
        try {
            const checkEvent = await EventModel.findById(idEvent)
            if(!checkEvent){
                res.status(404).json({
                    status:404,
                    message:'idEvent không hợp lệ',
                })
            }
            const comments = await CommentModel.find({event:idEvent}).select('-__v')
            .populate('user', '_id fullname photoUrl')
            .populate('replyComment.user', '_id fullname photoUrl')
            .sort({replyCommentCount:-1})
    
            res.status(200).json({
                status:200,
                message:'Thành công',
                data:comments
            })
        } catch (error) {
            res.status(500)
            throw new Error(error || 'Đã xảy ra lỗi getByIdEvent comment')
        }
    }else{
        try {
            const checkEvent = await EventModel.findById(idEvent);
            if (!checkEvent) {
                return res.status(404).json({
                    status: 404,
                    message: 'idEvent không hợp lệ',
                });
            }
            let idE = new mongoose.Types.ObjectId(idEvent);
            let idU = new mongoose.Types.ObjectId(idUser)
            const comments = await CommentModel.aggregate([
                { $match: { event: idE } }, // Lọc các bình luận của sự kiện
                { $sort: { replyCommentCount: -1 } },
                {
                    $addFields: {
                        isUserComment: { $cond: [{ $eq: ["$user", idU] }, 1, 0] },

                    }
                }, // Thêm trường `isUserComment` để đánh dấu bình luận của người dùng hiện tại
                { $sort: { isUserComment: -1} }, // Sắp xếp: Bình luận của `idUser` lên đầu, sau đó theo thời gian
                {
                    $lookup: {
                        from: 'users', 
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user',
                        pipeline: [
                            {
                              '$project':
                              {
                               "_id":1,
                               "fullname":1,
                               "photoUrl":1,

                              }
                            }
                          ]
                    }
                },
               
               
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true
                    }
                }, // Giải phóng mảng `userDetails`
                {
                    $lookup: {
                        from: 'users', // Bảng users
                        localField: 'replyComment.user',
                        foreignField: '_id',
                        as: 'replyCommentUsers',
                        pipeline: [
                            {
                              '$project':
                              {
                               "_id":1,
                               "fullname":1,
                               "photoUrl":1,

                              }
                            }
                          ]
                    }
                }, // Kết bảng user cho `replyComment`
                {
                    $addFields: {
                        replyComment: {
                            $map: {
                                input: '$replyComment',
                                as: 'reply',
                                in: {
                                    _id: '$$reply._id',
                                    content: '$$reply.content',
                                    createdAt: '$$reply.createdAt',
                                    updatedAt: '$$reply.updatedAt',
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$replyCommentUsers',
                                                    as: 'userDetail',
                                                    cond: { $eq: ['$$userDetail._id', '$$reply.user'] }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    isUserReplyComment: { $eq: ['$$reply.user', idU] }
                                }
                            }
                        }
                    }
                }, // Gắn thông tin user vào từng phần tử trong `replyComment`
                {
                    $addFields: {
                        replyComment: {
                            $sortArray: {
                                input: '$replyComment',
                                sortBy: { isUserReplyComment: -1, createdAt: 1 }
                            }
                        }
                    }
                }, // Sắp xếp replyComment theo isUserReplyComment và thời gia
                {
                    '$project':
                    {
                        '_id':1,
                        'content':1,
                        'event':1,
                        'replyComment':1,
                        'createdAt':1,
                        'updatedAt':1,
                        'replyCommentCount':1,
                        'isUserComment':1,
                        'user': { $arrayElemAt: ["$user", 0] },
                    }
                },
            ]);
    
            res.status(200).json({
                status: 200,
                message: 'Thành công',
                data: comments
            });
        } catch (error) {
            res.status(500);
            throw new Error(error || 'Đã xảy ra lỗi getByIdEvent comment');
        }
    }
    
})

module.exports = {
    commentEvent,
    replyCommentEvent,
    getByIdEvent
}