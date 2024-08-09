const mongoose = require("mongoose")
 const {Schema}= mongoose;
 
 const adressSchema = new Schema({
    userId :{

    Type:Schema.Types.ObjecId,
    ref:"User",
    required:true  
    } ,
    address :[{
        addressType:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        landMark:{
            type:String,
            required:true
        },
        state:{
            type:String,
            requied:true
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        phone:{
            type:String,
            reqired:true
        },
        altPhone:{
            type:String,
            required:true
        }
    }]

 })

 const Address = mongoose.model("Address",addressSchema)
 module.exports = Address