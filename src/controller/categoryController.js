const asyncHandle = require('express-async-handler')
require('dotenv').config()
const CategoryModel = require("../models/CategoryModel")



const addCategory = asyncHandle(async (req, res) => {
    const { name,image } = req.body
    if (req.body) {
        const createCategory = await CategoryModel.create({
            name,
            image
        })
        if(createCategory){
            res.status(200).json({
                status:200,
                message:'Thêm thành công',
                data:createCategory
            })
        }
    } else {
        res.status(401)
        throw new Error('Không có dữ liệu category')
    }
})

const getAll = asyncHandle(async (req, res) => {
   const categories = await CategoryModel.find()
   res.status(200).json({
    status:200,
    message:'Thành công',
    data:categories
})
})
module.exports = {
    addCategory,
    getAll
}