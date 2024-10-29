const mongoose =  require('mongoose')
const PromotionSchema = new mongoose.Schema(
{
    SaleOff:{type:Number,require:true},
    startDate:{type:Date,require:true},
    endDate:{type:Date,require:true},
},
{
    timestamps: true
}
);

const PromotionModel = mongoose.model("promotions",PromotionSchema);
module.exports = PromotionModel
