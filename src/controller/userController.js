const UserModel = require("../models/UserModel")
const EventModel = require("../models/EventModel")
const CategoryModel = require("../models/CategoryModel")
const asyncHandle = require('express-async-handler')
const http = require('http')
require('dotenv').config()

const EmailService = require('../service/EmailService')


const getAll = asyncHandle(async (req, res) => {
    const allUser = await UserModel.find().populate('idRole')
    res.status(200).json({
        status: 200,
        message: 'Thành công',
        data: {
            users: allUser
        }
    })
})

const updatePositionUser = asyncHandle(async (req, res) => {
    const { id, lat, lng } = req.body
    const user = await UserModel.findById(id)
    if (!user) {
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Người dùng không tồn tại')
    }
    const updateUser = await UserModel.findByIdAndUpdate(id, { position: { lat: lat, lng: lng } }, { new: true })
    res.status(200).json({
        status: 200,
        message: 'Cập nhập position user thành công',
        data: {
            user: updateUser
        }
    })
})

const updateFcmtoken = asyncHandle(async (req, res) => {
    const { uid, fcmtokens } = req.body
    const updateUser = await UserModel.findByIdAndUpdate(uid, { fcmTokens: fcmtokens }, { new: true })
    res.status(200).json({
        status: 200,
        message: 'Thành công',
        data: {
            fcmTokens: updateUser.fcmTokens ?? [],
        }
    })
})


const getUserById = asyncHandle(async (req, res) => {
    const { uid } = req.query
    // const Token = await notificationController.getAccessToken()
    // console.log("res",Token)
    if (uid) {
        const userDetails = await UserModel.findById(uid).select('historyTransaction').populate('historyTransaction.id')
        res.status(200).json({
            status: 200,
            message: 'Thành công',
            data: {
                user: userDetails
            }
        })
    } else {
        res.status(401)
        throw new Error('Người dùng không tồn tại')
    }
})

const updateProfile = asyncHandle(async (req, res) => {
    const { fullname, phoneNumber, bio, _id, photoUrl,address } = req.body
    if (!photoUrl) {
        const updateUser = await UserModel.findByIdAndUpdate(_id, { fullname, phoneNumber, bio,address}, { new: true })
        if (updateUser) {
            res.status(200).json({
                statusCode: 200,
                message: 'Cập nhập thành công',
                data: {
                    user: {
                        id:updateUser.id,
                        photoUrl:updateUser.photoUrl,
                        phoneNumber:updateUser.phoneNumber,
                        fullname:updateUser.fullname,
                        bio:updateUser.bio,
                        address:updateUser.address
                    }
                }
            })
        } else {
            res.status(401)
            throw new Error('Cập nhập thông tin không thành công')
        }
    } else {
        const updateUser = await UserModel.findByIdAndUpdate(_id, { photoUrl }, { new: true })
        if (updateUser) {
            res.status(200).json({
                statusCode: 200,
                message: 'Cập nhập thành công',
                data: {
                    user: {
                        id:updateUser.id,
                        photoUrl:updateUser.photoUrl,
                        // phoneNumber:updateUser.phoneNumber,
                        // fullname:updateUser.fullname,
                        // bio:updateUser.bio,
                        // address:updateUser.address

                    }
                }
            })
        } else {
            res.status(401)
            throw new Error('Cập nhập thông tin không thành công')
        }
    }

})

const updateRole = asyncHandle(async (req, res) => {
    const updateRoleUser = await UserModel.updateMany({}, { idRole: '66c523b677cc482c91fcaa61' }, { new: true })
    if (updateRoleUser) {
        res.status(200).json({
            statusCode: 200,
            message: 'Cập nhập thành công',
            data: {
                user: updateRoleUser
            }
        })
    } else {
        res.status(401)
        throw new Error('Cập nhập thông tin không thành công')
    }
})

const interestCategory = asyncHandle(async (req, res) => {
    const { idUser, idsCategory } = req.body;
    const user = await UserModel.findById(idUser);
    if (user) {
        // Tạo bản sao của `categoriesInterested`
        let categoriesInterestedByUser = [...user.categoriesInterested];

        // Thêm các `idCategory` từ `idsCategory` vào `categoriesInterestedByUser` nếu chưa có
        await Promise.all(idsCategory.map(async (idCategory) => {
            const category = await CategoryModel.findById(idCategory);
            if (category) {
                const usersInterestedCategory = [...category.usersInterested];

                const indexCategoryInterested = categoriesInterestedByUser.findIndex(
                    item => item.category.toString() === idCategory.toString()
                );
                const indexUserInterested = usersInterestedCategory.findIndex(
                    item => item.user.toString() === idUser.toString()
                );

                if (indexCategoryInterested === -1 && indexUserInterested === -1) {
                    categoriesInterestedByUser.push({ category: idCategory });
                    usersInterestedCategory.push({ user: idUser });
                    await CategoryModel.findByIdAndUpdate(idCategory, { usersInterested: usersInterestedCategory }, { new: true });
                }
            } else {
                res.status(401);
                throw new Error('Thể loại không tồn tại');
            }
        }));

        // Lọc `categoriesInterestedByUser` để giữ lại các `idCategory` có trong `idsCategory`
        const categoriesToKeep = categoriesInterestedByUser.filter(item =>
            idsCategory.includes(item.category.toString())
        );

        // Tìm các `idCategory` cần xóa khỏi `categoriesInterestedByUser`
        const categoriesToRemove = categoriesInterestedByUser.filter(item => 
            !idsCategory.includes(item.category.toString())
        );

        // Xóa `idUser` khỏi `usersInterested` của các `Category` không còn được quan tâm
        await Promise.all(categoriesToRemove.map(async (item) => {
            const category = await CategoryModel.findById(item.category);
            if (category) {
                const updatedUsersInterested = category.usersInterested.filter(
                    userItem => userItem.user.toString() !== idUser.toString()
                );
                await CategoryModel.findByIdAndUpdate(item.category, { usersInterested: updatedUsersInterested }, { new: true });
            }
        }));

        // Cập nhật lại `categoriesInterestedByUser` của `user`
        const newUser = await UserModel.findByIdAndUpdate(
            idUser,
            { categoriesInterested: categoriesToKeep },
            { new: true }
        ).populate({
            path: 'categoriesInterested.category',
            select: '_id name image'
        }).select('-categoriesInterested.createdAt -categoriesInterested._id');;

        res.status(200).json({
            status: 200,
            message: 'Cập nhật thành công',
            data: {
                user: newUser,
            }
        });
    } else {
        res.status(401);
        throw new Error('Người dùng không tồn tại');
    }
});



const interestEvent = asyncHandle(async (req, res) => {
    const { idUser, idEvent } = req.body
    const user = await UserModel.findById(idUser)
    const event = await EventModel.findById(idEvent)
    if (user && event) {
        const eventsInterestedByUser = [...user.eventsInterested]
        const usersInterestedEvent = [...event.usersInterested]
        const indexEventInterested = eventsInterestedByUser.findIndex(item => item.event.toString() === idEvent.toString())
        const indexUserInterested = usersInterestedEvent.findIndex(item => item.user.toString() === idUser.toString())
        if ((indexEventInterested !== -1) && (indexUserInterested !== -1)) {
            eventsInterestedByUser.splice(indexEventInterested, 1)
            usersInterestedEvent.splice(indexUserInterested, 1)
            const updateUser = await UserModel.findByIdAndUpdate(idUser, { eventsInterested: eventsInterestedByUser }, { new: true })
            const updateEvent = await EventModel.findByIdAndUpdate(idEvent, { usersInterested: usersInterestedEvent }, { new: true })
            res.status(200).json({
                status: 200,
                message: 'Cập nhập thành công',
                data: {
                    user: updateUser,
                    event: updateEvent
                }
            })
        } else {
            eventsInterestedByUser.push({ event: idEvent })
            usersInterestedEvent.push({ user: idUser })
            const updateUser = await UserModel.findByIdAndUpdate(idUser, { eventsInterested: eventsInterestedByUser }, { new: true })
            const updateEvent = await EventModel.findByIdAndUpdate(idEvent, { usersInterested: usersInterestedEvent }, { new: true })
            res.status(200).json({
                status: 200,
                message: 'Cập nhập thành công',
                data: {
                    user: updateUser,
                    event: updateEvent
                }
            })
        }

    } else {
        res.status(401)
        throw new Error('Người dùng hoặc sự kiện không tồn tại')
    }

})

const getEventInterestedByIdUser = asyncHandle(async (req, res) => {
    const { idUser } = req.query
    const events = await UserModel.findByIdAndUpdate(idUser).select('eventsInterested.event')
    .populate({
        path:'eventsInterested.event',
        select:'-description -authorId -uniqueViewRecord -uniqueViewCount -viewRecord',
        match: { statusEvent: { $nin: ['Cancelled', 'PendingApproval'] }},
        populate:[
        {
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
                select:'price',
                options: { sort: { price: -1 } }, // Sắp xếp the

            },
        }]
    })
    const eventsMap = events.eventsInterested.map(item => item.event);
    eventsMap.forEach(event => {//sap xếp các suất diễn đã kết thúc xuống cuối
        event.showTimes = [
            ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
            ...event.showTimes.filter(showTime => showTime.status === 'Ended')
        ];
    });
    // const sortedStartEvents = eventsMap.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
    //     const dateA = a.showTimes[0]?.startDate ? new Date(a.showTimes[0].startDate) : new Date(0);
    //     const dateB = b.showTimes[0]?.startDate ? new Date(b.showTimes[0].startDate) : new Date(0);
    //     return dateA - dateB;
    // });    
    res.status(200).json({
        status: 200,
        message: 'Cập nhập thành công',
        data: eventsMap.reverse()
    })
})

const testSendGmail = asyncHandle(async (req, res) => {
    await EmailService.handleSendMailPaymmentSuccess({
        invoiceCode:"09877223123",
        titleEvent:'2024 SUPER JUNIOR-D&E WORLD TOUR : ECLIPSE in HO CHI MINH CITY',
        showTimeStart:new Date('2024-12-31T12:30:00.000+00:00'),
        address:'2024 SUPER JUNIOR-D&E WORLD TOUR : ECLIPSE in HO CHI MINH CITY',
        location:'Military Zone 7 Indoor Sports Complex',
        userName:'Nguyễn Quang Huy',
        email:'a@gmail.com',
        phoneNumber:'0367381282',
        paymentTime:new Date('2024-12-31T12:30:00.000+00:00'),
        totalTicket:5,
        totalPrice:500000,

    },"dinhphongtamquoc453@gmail.com")
    res.status(200).json({
        statusCode: 200,
        message: 'Cập nhập thành công',
        
    })
})


module.exports = {
    getAll,
    updatePositionUser,
    updateFcmtoken,
    getUserById,
    updateProfile,
    updateRole,
    interestEvent,
    interestCategory,
    getEventInterestedByIdUser,
    testSendGmail,

}