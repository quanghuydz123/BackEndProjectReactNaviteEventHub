const mongoose =  require('mongoose')
const InVoiceSchema = new mongoose.Schema(
{
    fullname:{type:String,required:true},
    email:{type:String,required:true},
    paymentMethod:{type:String,enum:['Vnpay']},
    phone:{type:Number,required:true},
    address:{type:String},
    invoiceCode:{type:String,required:true,unique:true},
    totalTicket:{type:Number,required:true},
    totalPrice:{type:Number},
    note:{Type:String},
    status:{type:String,enum:['Success','Failed']}
    
},
{
    timestamps: true
}
);

const InVoiceModel = mongoose.model("invoices",InVoiceSchema);
module.exports = InVoiceModel
