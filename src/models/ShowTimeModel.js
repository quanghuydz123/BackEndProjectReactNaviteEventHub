const mongoose =  require('mongoose')
const ShowTimeSchema = new mongoose.Schema(
{
    startDate:{type:Date,require:true},
    endDate:{type:Date,require:true},
    typeTickets:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'typetickets',
        require:true        
    }],
    status:{type:String,enum:['NotStarted','Ongoing','Ended','SoldOut','OnSale','SaleStopped','NotYetOnSale']}
},
{
    timestamps: true
}
);

const ShowTimeModel = mongoose.model("showtimes",ShowTimeSchema);
module.exports = ShowTimeModel
