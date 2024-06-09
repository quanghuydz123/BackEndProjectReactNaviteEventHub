const UserModel = require("../models/UserModel")
const asyncHandle = require('express-async-handler')
require('dotenv').config()



const getAll = asyncHandle( async (req, res) => {
    const allUser = await UserModel.find()
    console.log(allUser)
    res.status(200).json({
        message:'Thành công',
        data:{
            users:allUser
        }
    })
})
module.exports = {
    getAll,
}