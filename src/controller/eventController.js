const asyncHandle = require('express-async-handler')
require('dotenv').config()
const EventModel = require("../models/EventModel")
const ShowTimeModel = require("../models/ShowTimeModel")
const CategoryModel = require("../models/CategoryModel")

const calsDistanceLocation = require("../utils/calsDistanceLocation")


const addEvent = asyncHandle(async (req, res) => {
    const { title, description, Address, addressDetals, Location, position, photoUrl, price, users, category, authorId, startAt, endAt,  } = req.body
    if (req.body) {
        const createEvent = await EventModel.create({
            title,
            description,
            Address,
            addressDetals,
            Location,
            position,
            photoUrl,
            price,
            users,
            category,
            authorId,
            startAt,
            endAt,
            
        })
        if (createEvent) {
            res.status(200).json({
                status:200,
                message: 'Thêm thành công',
                data: createEvent
            })
        }else{
            res.status(400)
            throw new Error('Thêm thất bại')
        }
    } else {
        res.status(401)
        throw new Error('Không có dữ liệu event')
    }
})

const   getAllEvent = asyncHandle(async (req, res) => {
    const {limit,limitDate} = req.query
    const events = await EventModel.find({date:{$gte:limitDate}}).populate('category users authorId').sort({"startAt":1})
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:events
    })
})
const getEvents = asyncHandle(async (req, res) => {
    const {lat,long,distance,limit,limitDate,searchValue,isUpcoming,isPastEvents,categoriesFilter,
        startAt,endAt,minPrice,maxPrice} = req.query
    // console.log("minPrice,maxPrice",minPrice,maxPrice)
    const filter = {statusEvent: { $nin: ['Cancelled', 'PendingApproval'] }}
    const regex = new RegExp(searchValue ?? '', 'i')//để cho không phân biệt hoa thường
    filter.title = {'$regex': regex}
    // if(categoriesFilter){
    //     filter.categories = {$in:[categoriesFilter]}
    // }
    if(categoriesFilter){
        filter.category = {$in:categoriesFilter}
    }
    if(startAt && endAt){
        filter.startAt = {$gte:new Date(startAt).getTime()}
        filter.endAt = {$lt:new Date(endAt).getTime()}
    }
    if (minPrice && maxPrice) {
        filter.price = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice) {
        filter.price = { $gte: minPrice };
    } else if (maxPrice) {
        filter.price = { $lte: maxPrice };
    }
    const currentTime = new Date();
    const events = await EventModel.find(filter)
    .populate('category', '_id name image')
    // .populate('authorId')
    .populate('usersInterested.user', '_id fullname email photoUrl')
    .populate({
        path:'showTimes',
        options: { sort: { startDate: 1 } } // Sắp xếp theo startDate tăng dần
    })
    .limit(limit ?? 0).select('-description -authorId')
    // const showTimeCopy = [...events.map((event)=>event.showTimes)]
    // const showTimeCopySort = showTimeCopy.sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
    // events.showTimes = showTimeCopySort
    // events.forEach(event => {
    //     event.showTimes = [...event.showTimes].sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
    // });
    events.forEach(event => {//sap xếp các suất diễn đã kết thúc xuống cuối
        event.showTimes = [
            ...event.showTimes.filter(showTime => showTime.status !== 'Ended'),
            ...event.showTimes.filter(showTime => showTime.status === 'Ended')
        ];
    });
    const sortedStartEvents = events.sort((a, b) => {//sắp xếp sự kiện tăng dần theo thời gian xuất diễn
        const dateA = a.showTimes[0]?.startDate ? new Date(a.showTimes[0].startDate) : new Date(0);
        const dateB = b.showTimes[0]?.startDate ? new Date(b.showTimes[0].startDate) : new Date(0);
        return dateA - dateB;
    });    
    //bỏ các sự kiện đã kết thúc xuống cuối
    const sortedEvents = sortedStartEvents.sort((a, b) => (a.statusEvent === 'Ended') - (b.statusEvent === 'Ended'));
    // console.log(sortedEvents[0].title,sortedEvents[0].showTimes.length)
    if(lat && long && distance){
        const eventsNearYou = []
        if(sortedEvents.length > 0 ){
            sortedEvents.forEach((event)=>{
                const eventDistance = calsDistanceLocation(lat,long,event.position.lat,event.position.lng)
                if(eventDistance < distance){
                    eventsNearYou.push(event)
                }
            })
        }
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:sortedEvents
        })
    }else{
        // const eventsNew = events.filter(event => event.statusEvent !== 'Ended');
        // const eventEnded = events.filter(event => event.statusEvent === 'Ended');
        // const sortedEvents = eventsNew.concat(eventEnded);
        // console.log("eventEnded",eventEnded)
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:sortedEvents
        })
    }
})

const updateFollowerEvent = asyncHandle(async (req, res) => {
    const {idUser,idEvent} = req.body
    const event = await EventModel.findById({_id:idEvent})
    console.log(event)
    res.status(200).json({
        message:'Cập nhập followers thành công',
        
    })
})
const getEventById = asyncHandle(async (req, res) => {
    const {eid} = req.query
    const event = await EventModel.findById(eid)
    .populate('category', '_id name image')
    .populate('usersInterested.user', '_id fullname email photoUrl')
    .populate('authorId')
    .populate({
        path:'showTimes',
        populate:{
            path:'typeTickets',
        }
    })
    // const showTimeCopy = event.showTimes
    // const showTimeCopySort = showTimeCopy.sort((a, b) => (a.status === 'Ended') - (b.status === 'Ended'));
    // event.showTimes=showTimeCopySort
    // Sao chép mảng `showTimes` và sắp xếp
    const showTimeCopySort = [
        ...event.showTimes.filter(showTime => showTime.status !== 'Ended'), 
        ...event.showTimes.filter(showTime => showTime.status === 'Ended')
    ];
    event.showTimes = showTimeCopySort;
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:event
    })
})

const updateEvent = asyncHandle(async (req, res) => {
    const {idEvent,showTimes} = req.body
    const event = await EventModel.findByIdAndUpdate(idEvent,{showTimes:showTimes},{new:true})
    res.status(200).json({
        status:200,
        message:'Thành công',
        // data:event  
    })
})

const buyTicket = asyncHandle(async (req, res) => {
    const data = req.body
    console.log("data",data)
    res.status(200).json({
        status:200,
        message:'Thành công',
        
    })
})
const updateStatusEvent = asyncHandle(async (req, res) => {
    const events = await EventModel.find().select('_id showTimes statusEvent')
    await Promise.all(events.map(async (event)=>{
        if(event.statusEvent !== 'PendingApproval' && event.statusEvent !== 'Cancelled'){
            const showTimes = await ShowTimeModel.find({ _id: { $in: event.showTimes } });
            const allNotStarted = showTimes.every(showTime => showTime.status === 'NotStarted');
            const allEnded = showTimes.every(showTime => showTime.status === 'Ended');
            const allSoldOut = showTimes.every(showTime => showTime.status === 'SoldOut');
            const anyOngoing = showTimes.some(showTime => showTime.status === 'Ongoing');
            const anyOnSale = showTimes.some(showTime => showTime.status === 'OnSale');
            if (allNotStarted) {
                event.statusEvent = 'NotStarted';
            } else if (allEnded) {
                event.statusEvent = 'Ended';
            } else if (allSoldOut) {
                event.statusEvent = 'SoldOut';
            } else if (anyOngoing) {
                event.statusEvent = 'Ongoing';
            } else if (anyOnSale) {
                event.statusEvent = 'OnSale';
            }
        
            await event.save();
        }
    }))
    res.status(200).json({
        status:200,
        message:'Thành công',
        // data:events  
    })
})

module.exports = {
    addEvent,
    getAllEvent,
    getEvents,
    updateFollowerEvent,
    getEventById,
    updateEvent,
    buyTicket,
    updateStatusEvent
}