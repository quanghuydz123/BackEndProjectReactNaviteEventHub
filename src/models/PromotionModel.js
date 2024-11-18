const mongoose =  require('mongoose')
const PromotionSchema = new mongoose.Schema(
{
    SaleOff:{type:Number,required:true},
    startDate:{type:Date,required:true},
    endDate:{type:Date,required:true},
},
{
    timestamps: true
}
);

const PromotionModel = mongoose.model("promotions",PromotionSchema);
module.exports = PromotionModel
