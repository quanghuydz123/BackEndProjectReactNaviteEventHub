const mongoose =  require('mongoose')
const TypeTicketSchema = new mongoose.Schema(
{
    name:{type:String,required:true},
    description:{type:String},
    type:{type:String,enum:['Free','Paid'],required:true,default:'Paid'},
    amount:{type:Number,min:0},
    price:{type:Number,min:0},
    startSaleTime:{type:Date,required:true},
    endSaleTime:{type:Date,required:true},
    status:{type:String,enum:['NotStarted','OnSale',"Ended","SoldOut","Canceled"]},
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
