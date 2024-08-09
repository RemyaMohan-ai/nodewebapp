const mongoose = require("mongoose")
const {Schema} = mongoose
const schema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:String,
        required:false,
        sparse:true,
        default:null
    },
    password:{
        type:String,
        required:false
    },
    googleId :{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:[
        {
            type:Schema.Types.ObjectId,
            ref:"CArt"

        }
    ],
    wallet:[
        {
            type:Number,
            default:0
        }
    ],
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    CreatedOn:{
        type:Date,
        default:Date.now
    }

    // ,
    // otp:{
    //     type:String
    // },
    // otpCreatedat:{
    //     type:Date
    // },

    // otpCreatedat:{
    //     type:Date
    // },
    // blockuntil:{
    //     type:Date
    // },
    // is_admin:{
    //     type:Number,
    //     default:0
    // }
})


const User  = mongoose.model("User",schema)
module.exports = User