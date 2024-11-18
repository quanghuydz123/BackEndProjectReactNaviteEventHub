const mongoose =  require('mongoose')
const RoleSchema = new mongoose.Schema(
{
    key:{type:String,required:true},
    name:{type:String,required:true},
},
{
    timestamps: true
}
);

const RoleModel = mongoose.model("roles",RoleSchema);
module.exports = RoleModel
