const mongoose =  require('mongoose')
const CategorySchema = new mongoose.Schema(
{
    name: {type: String, required: true},
    image: {type: String },
    usersInterested:[{
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            require:true
        },
        createdAt:{
            type: Date,
            default:Date.now()
        }
    }],
},
{
    timestamps: true
}
);

const CategoryModel = mongoose.model("Categories",CategorySchema);
module.exports = CategoryModel
