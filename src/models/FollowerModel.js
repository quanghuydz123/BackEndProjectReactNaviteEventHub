const { default: mongoose } = require("mongoose");

const FollowerSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    events:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
    }],
    categories:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
    }]

})

const FollowerModel = mongoose.model('followers', FollowerSchema)
module.exports = FollowerModel