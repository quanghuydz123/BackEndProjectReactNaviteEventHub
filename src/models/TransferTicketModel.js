const mongoose =  require('mongoose')
const TransferTicketSchema = new mongoose.Schema(
{
    ticket:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tickets',
        required: true,
    },
    fromUser:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    toUser:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    status:{type:String,enum:['Success','Failed']}
},
{
    timestamps: true
}
);

const TransferTicketModel = mongoose.model("transfertickets",TransferTicketSchema);
module.exports = TransferTicketModel
