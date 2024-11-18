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
    
    wallet:[
        {
            type:Number,
            default:0
        }
    ], 
    referralCode:{
        type: String

        },
    redeemed:{
        type:Boolean,
        default:false
    },

    balance: {
        type: Number,
        required: true,
        default: 0,
      },
      transactions: [
        {
          type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          date: {
            type: Date,
            default: Date.now,
          },
          description: {
            type: String,
            default: '',
          },
        },
      ],



    CreatedOn:{
        type:Date,
        default:Date.now
    }
      
})


const User  = mongoose.model("User",schema)
module.exports = User