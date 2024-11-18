const mongoose = require("mongoose")
const {Schema} = mongoose

const wishListSchema = new Schema({
    user :{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"User",
        required: true
    },
    products:[{
        type:mongoose.Schema.Types.ObjectId, 
        ref :"Product",
        
    }]
}) 

const wishlist = mongoose.model("wishlist",wishListSchema)
module.exports = wishlist
