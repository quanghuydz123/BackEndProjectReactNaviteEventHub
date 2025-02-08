const mongoose =  require('mongoose')
const InVoiceSchema = new mongoose.Schema(
{
    fullname:{type:String},
    email:{type:String,required:true},
    paymentMethod:{type:String,enum:['VNPAY'],default:'VNPAY'},
    phoneNumber:{type:Number},
    address:{
        province:{
            name:{type:String},
            code:{type:Number},
        },
        districts:{
            name:{type:String},
            code:{type:Number},
        },
        ward:{
            name:{type:String},
            code:{type:Number},
        },
        houseNumberAndStreet:{type:String}
    },
    fullAddress:{type:String},
    invoiceCode:{type:String,required:true,unique:true},
    totalTicket:{type:Number,required:true},
    totalPrice:{type:Number},
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'typetickets',
        required:true        
    },
    totalDiscount:{type:Number,default:0},
    status:{type:String,enum:['Success','Failed'],default:'Success'}
    
},
{
    timestamps: true
}
);

const InVoiceModel = mongoose.model("invoices",InVoiceSchema);
module.exports = InVoiceModel
