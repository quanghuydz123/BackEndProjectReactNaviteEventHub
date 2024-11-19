const mongoose =  require('mongoose')
const TicketSchema = new mongoose.Schema(
{
    price:{type:Number,required:true,default:0},
    isCheckIn:{type:Boolean,required: true,default:false},
    qrCode:{type:String,required:true,unique:true},
    typeTicket:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'typetickets',
        required: true,
    },  
    showTime:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'showtimes',
        required: true,
    },
    event:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true,
    },
    invoice:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'invoices',
    },
    current_owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    seatNumber:{type:Number},
    status:{type:String,enum:['Sold','Reserved','Canceled']}

},
{
    timestamps: true
}
);

const TicketModel = mongoose.model("tickets",TicketSchema);
module.exports = TicketModel
