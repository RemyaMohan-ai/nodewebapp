const mongoose = require("mongoose")
 const {Schema}= mongoose;
 
 const adressSchema = new Schema({
    userId :{
        type:Schema.Types.ObjectId,
        ref:"User",
    } ,
    address:[{
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        reqired:true
    },
    altPhone:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
        building:{
            type:String,
            required:true
        },
        addresslane:{
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
        
        pincode:{
            type:Number,
            required:true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
})

 const Address = mongoose.model("Address",adressSchema)
 module.exports = Address