const mongoose =  require('mongoose')
const TicketSchema = new mongoose.Schema(
{
    seatNumber:{type:Number},
    price:{type:Number},
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
        required: true,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
},
{
    timestamps: true
}
);

const TicketModel = mongoose.model("tickets",TicketSchema);
module.exports = TicketModel
