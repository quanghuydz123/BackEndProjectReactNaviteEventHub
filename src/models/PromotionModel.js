const mongoose =  require('mongoose')
const PromotionSchema = new mongoose.Schema(
{
    type:{type:String,enum:['FixedAmount','Percentage'],required:true},
    value:{type:Number,required:true},
    startDate:{type:Date,required:true},
    endDate:{type:Date,required:true},
    status:{type:String,enum:['NotStarted','Ongoing','Ended','Paused','Canceled']}
},
{
    timestamps: true
}
);

const PromotionModel = mongoose.model("promotions",PromotionSchema);
module.exports = PromotionModel
