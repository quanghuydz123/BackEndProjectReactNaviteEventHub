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
module.exports = {
    getAll,
}