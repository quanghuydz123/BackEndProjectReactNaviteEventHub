const mongoose =  require('mongoose')
const RoleSchema = new mongoose.Schema(
{
    key:{type:String,require:true},
    name:{type:String,require:true},
},
{
    timestamps: true
}
);

const RoleModel = mongoose.model("roles",RoleSchema);
module.exports = RoleModel
