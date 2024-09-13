const mongoose =  require('mongoose')
const RollSchema = new mongoose.Schema(
{
    key:{type:String,required:true},
    name:{type:String,required:true},
},
{
    timestamps: true
}
);

const RoleModel = mongoose.model("roles",RollSchema);
module.exports = RoleModel
