const mongoose =  require('mongoose')
const OrganizerSchema = new mongoose.Schema(
{
    address:{type:String},
    contact:{
        linkFacebook:{type:String},
        linkZalo:{type:String},
        linkYoutube:{type:String},
        linkWebsite:{type:String},
        email:{type:String}
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique : true
    },
    eventCreated:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true,
    }],
},
{
    timestamps: true
}
);

const OrganizerModel = mongoose.model("organizers",OrganizerSchema);
module.exports = OrganizerModel
