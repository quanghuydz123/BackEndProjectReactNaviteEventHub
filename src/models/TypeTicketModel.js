const mongoose =  require('mongoose')
const TypeTicketSchema = new mongoose.Schema(
{
    name:{type:String,require:true},
    description:{type:String},
    type:{type:String,enum:['Free','Paid'],require:true,default:'Paid'},
    amount:{type:Number},
    price:{type:Number,min:0},
    startSaleTime:{type:Date,require:true},
    endSaleTime:{type:Date,require:true},
    status:{type:String,enum:['NotStarted','OnSale',"Ended","SoldOut"]},
    promotion:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'promotions',
    },

},
{
    timestamps: true
}   
);

const TypeTicketModel = mongoose.model("typetickets",TypeTicketSchema);
module.exports = TypeTicketModel
