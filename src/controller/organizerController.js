const asyncHandle = require('express-async-handler')
const OrganizerModel = require("../models/OrganizerModel")
const { cleanString } = require('../utils/handleString')

const getAll = asyncHandle(async (req, res) => {
    const organizers = await OrganizerModel.find().select('-eventCreated -createdAt -updatedAt')
    .populate(
       {
         path:'user',
         select:'_id fullname email photoUrl bio numberOfFollowing numberOfFollowers',
       }
    )
    organizers.sort((a, b) => {
        const aa = a.user.numberOfFollowers ?? 0
        const bb = b.user.numberOfFollowers ?? 0
        return bb - aa  
    });


     res.status(200).json({
            status:200,
            message:'Thêm thành công',
            data:organizers
        })
})


const createOrganizer = asyncHandle(async (req, res) => {
    const {idUser,idEvent} = req.body
    const organizer = await OrganizerModel.findOne({user:idUser})
    if(!organizer){
        const organizerNew = new OrganizerModel({
            user:idUser,
            eventCreated:[idEvent]
        })
        await organizerNew.save()
        res.status(200).json({
            status:200,
            message:'Thêm thành công',
            data:organizerNew
        })
    }else{
        const eventCreated = [...organizer.eventCreated]
        eventCreated.push(idEvent)
        console.log("eventCreated",eventCreated)
        const organizerUpdate = await OrganizerModel.findOneAndUpdate({user:idUser},{eventCreated:eventCreated},{new:true})
        res.status(200).json({
            status:200,
            message:'Thêm thành công',
            data:organizerUpdate
        })
    }
})

const getEventCreatedOrganizerById = asyncHandle(async (req, res) => {
    const {idUser} = req.query
    if(!idUser){
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Hãy nhập idUser')
    }
    const organizer = await OrganizerModel.findOne({user:idUser}).select('_id eventCreated')
    .populate({
        path:'eventCreated',
        select:'-description -authorId',
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
                select:'price type',
                options: { sort: { price: -1 } }, // Sắp xếp the
                populate: {
                    path: 'promotion',
                    select:'-startDate -endDate -createdAt -updatedAt',
                    options: { limit: 1 } 
                }
            },
        }
            
        ]
    })
    if(organizer){
        const events = [...organizer.eventCreated]
        events.forEach(event => {//sap xếp các suất diễn đã kết thúc xuống cuối
            event.showTimes = [
                ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
                ...event.showTimes.filter(showTime => showTime.status === 'Ended')
            ];
        });
        const sortedStartEvents = events.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
            const dateA = a.showTimes[0]?.startDate ? new Date(a.showTimes[0].startDate) : new Date(0);
            const dateB = b.showTimes[0]?.startDate ? new Date(b.showTimes[0].startDate) : new Date(0);
            //dateB - dateA giảm dần
            return dateA - dateB;
        });    
        //bỏ các sự kiện đã kết thúc xuống cuối
        const sortedEvents = sortedStartEvents.sort((a, b) => (a.statusEvent === 'Ended') - (b.statusEvent === 'Ended'));
        res.status(200).json({
            status:200,
            message:'thành công',
            data:sortedEvents
        })
    }else{
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Organizer không tồn tại')
    }
    
})

const getEventCreatedOrganizerByIdForOrganizer = asyncHandle(async (req, res) => {
    const {idUser,page =1,limit=3,filterStatus,searchValue} = req.query
    console.log("idUser",idUser,filterStatus)
    if(!idUser){
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Hãy nhập idUser')
    }
    const filter = { user:idUser }
  
    let filterStatusEvent = {$nin:['']}
    if(filterStatus){
        if(filterStatus === 'upcoming'){
            filterStatusEvent = {$nin: ['Cancelled', 'PendingApproval', 'Ended'] }
        }
        else if(filterStatus === 'past'){
            filterStatusEvent = 'Ended'
        }else if(filterStatus === 'pending'){
            filterStatusEvent = 'PendingApproval'

        }else if(filterStatus === 'canceled'){
            filterStatusEvent = 'Cancelled'

        }
    }
    let match = { statusEvent: filterStatusEvent };
    if(searchValue){
        const regex = new RegExp(cleanString(searchValue), 'i')
        match.titleNonAccent = { $regex: regex };
    }
    const organizer = await OrganizerModel.findOne(filter).select('_id eventCreated')
    .populate({
        path:'eventCreated',
        select:'-description -authorId -uniqueViewCount -uniqueViewRecord -viewRecord -usersInterested',
        match,
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
                select:'price type',
                options: { sort: { price: -1 } }, // Sắp xếp the
                populate: {
                    path: 'promotion',
                    select:'-startDate -endDate -createdAt -updatedAt',
                    options: { limit: 1 } 
                }
            },
        }
            
        ]
    })
    if(organizer){
        const events = [...organizer.eventCreated]
        events.forEach(event => {//sap xếp các suất diễn đã kết thúc xuống cuối
            event.showTimes = [
                ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
                ...event.showTimes.filter(showTime => showTime.status === 'Ended')
            ];
        });
        const sortedStartEvents = events.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
            const dateA = a.showTimes[0]?.startDate ? new Date(a.showTimes[0].startDate) : new Date(0);
            const dateB = b.showTimes[0]?.startDate ? new Date(b.showTimes[0].startDate) : new Date(0);
            //dateB - dateA giảm dần
            return dateA - dateB;
        });    
        const totalEvents = sortedStartEvents.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedEvents = sortedStartEvents.slice(startIndex, endIndex);
        res.status(200).json({
            status:200,
            message:'thành công',
            data:paginatedEvents,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvents / limit),
                totalItems: totalEvents,
                limit: parseInt(limit),
            },
        })
    }else{
        res.status(400)//ngăn không cho xuống dưới
        throw new Error('Organizer không tồn tại')
    }
    
})


module.exports = {
    getAll,
    createOrganizer,
    getEventCreatedOrganizerById,
    getEventCreatedOrganizerByIdForOrganizer
}