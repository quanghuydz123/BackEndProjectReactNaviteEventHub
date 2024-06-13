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
        console.log("createCategory",createCategory)
        if(createCategory){
            res.status(200).json({
                message:'Thêm thành công',
                data:{
                    category:createCategory
                }
            })
        }
    } else {
        res.status(401)
        throw new Error('Không có dữ liệu category')
    }
})
module.exports = {
    addCategory,
}