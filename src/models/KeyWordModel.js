const mongoose =  require('mongoose')
const KeyWordSchema = new mongoose.Schema(
{
    name:{type:String, required:true, unique:true},
    popularity: { type: Number, default: 0 },  

},
{
    timestamps: true
}
);

const KeyWordModel = mongoose.model("keywords",KeyWordSchema);
module.exports = KeyWordModel
