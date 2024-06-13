const mongoose =  require('mongoose')
const CategorySchema = new mongoose.Schema(
{
    name: {type: String, required: true},
    image: {type: String },
},
{
    timestamps: true
}
);

const CategoryModel = mongoose.model("Categories",CategorySchema);
module.exports = CategoryModel
