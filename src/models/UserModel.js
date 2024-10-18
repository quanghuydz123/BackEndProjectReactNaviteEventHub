const { Double } = require("mongodb");
const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullname:{type:String},
    email:{type:String,require:true},
    password:{type:String,require:true},
    isAdmin:{type:Boolean,require:true},
    photoUrl:{type:String},
    phoneNumber:{type:String},
    bio:{
        type:String
    },  
    position:{
        lat:{type:Number},
        lng:{type:Number}
    },
    fcmTokens:[{type:String}],
    idRole:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'roles',
    },
    eventsInterested:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        default:[]
    }],
    createAt:{type:Date,default:Date.now()},
    updateAt:{type:Date,default:Date.now()}

})

const UserModel = mongoose.model('users',UserSchema)
module.exports = UserModel