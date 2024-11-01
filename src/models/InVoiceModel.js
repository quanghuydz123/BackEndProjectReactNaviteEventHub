const mongoose =  require('mongoose')
const InVoiceSchema = new mongoose.Schema(
{
    fullname:{type:String,require:true},
    email:{type:String,require:true},
    paymentMethod:{type:String},
    phone:{type:Number,require:true},
    totalTicket:{type:Number,require:true},
    totalPrice:{type:Number},
    note:{Type:String},
    
},
{
    timestamps: true
}
);

const InVoiceModel = mongoose.model("invoices",InVoiceSchema);
module.exports = InVoiceModel
