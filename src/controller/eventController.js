const asyncHandle = require('express-async-handler')
require('dotenv').config()
const EventModel = require("../models/EventModel")



const addEvent = asyncHandle(async (req, res) => {
    const { title, description, Address, addressDetals, Location, position, photoUrl, price, users, category, authorId, startAt, endAt, date } = req.body
    console.log(req.body)
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
        }
    } else {
        res.status(401)
        throw new Error('Không có dữ liệu event')
    }
})
module.exports = {
    addEvent,
}