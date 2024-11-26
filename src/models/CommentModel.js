const mongoose =  require('mongoose')
const CommentSchema = new mongoose.Schema(
{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    content: { type: String, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'events', required: true },
    replyCommentCount:{type:Number,default:0},
    isDeleted:{type:Boolean,default:false},
    replyComment:[{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        content: { type: String, required: true },
        createdAt:{type:Date,default:Date.now()},
        updatedAt:{type:Date,default:Date.now()},
        isDeleted:{type:Boolean,default:false},
    }]
},
{
    timestamps: true
}
);

const CommentModel = mongoose.model("comments",CommentSchema);
module.exports = CommentModel
