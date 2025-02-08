const mongoose =  require('mongoose')
const PromotionSchema = new mongoose.Schema(
{
    title:{type:String},
    discountType:{type:String,enum:['FixedAmount','Percentage'],required:true},
    discountValue:{type:Number,required:true},
    startDate:{type:Date,required:true},
    endDate:{type:Date,required:true},
    event:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'events',
            required: true,
    },
    typeTickets:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'typetickets',
        required: true,
    }],
    status:{type:String,enum:['NotStarted','Ongoing','Ended','Canceled']}
},
{
    timestamps: true
}
);

const PromotionModel = mongoose.model("promotions",PromotionSchema);
module.exports = PromotionModel
