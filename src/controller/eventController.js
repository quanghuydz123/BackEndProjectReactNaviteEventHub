const asyncHandle = require('express-async-handler')
require('dotenv').config()
const EventModel = require("../models/EventModel")
const calsDistanceLocation = require("../utils/calsDistanceLocation")


const addEvent = asyncHandle(async (req, res) => {
    const { title, description, Address, addressDetals, Location, position, photoUrl, price, users, category, authorId, startAt, endAt, date } = req.body
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
            date
        })
        if (createEvent) {
            res.status(200).json({
                status:200,
                message: 'Thêm thành công',
                data: {
                    users: createEvent
                }
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

const getAllEvent = asyncHandle(async (req, res) => {
    const {limit,limitDate} = req.query
    console.log(limitDate)
    const events = await EventModel.find({date:{$gte:limitDate}}).populate('category users authorId').sort({"date":1})
    res.status(200).json({
        status:200,
        message:'Thành công',
        data:{
            events:events
        }
    })
})
const getEvents = asyncHandle(async (req, res) => {
    const {lat,long,distance,limit,limitDate} = req.query
    const events = await EventModel.find().populate('category users authorId').limit(limit ?? 0).sort({"date":1})
    if(lat && long && distance){
        const eventsNearYou = []
        if(events.length > 0 ){
            events.forEach((event)=>{
                const eventDistance = calsDistanceLocation(lat,long,event.position.lat,event.position.lng)
                if(eventDistance < distance){
                    eventsNearYou.push(event)
                }
            })
        }
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:{
                events:eventsNearYou
            }
        })
    }else{
        res.status(200).json({
            status:200,
            message:'Thành công',
            data:{
                events:events
            }
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
module.exports = {
    addEvent,
    getAllEvent,
    getEvents,
    updateFollowerEvent
}