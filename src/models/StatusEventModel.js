const mongoose =  require('mongoose')
const StatusEventSchema = new mongoose.Schema(
{
    name:{type:String,enum:['PendingApproval','Ongoing','Past','Cancelled','OnSale','SoldOut'],required:true},
},
{
    timestamps: true
}
);

const StatusEventModel = mongoose.model("statusevents",StatusEventSchema);
module.exports = StatusEventModel
