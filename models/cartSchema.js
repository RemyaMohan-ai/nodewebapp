const mongoose = require ("mongoose")
const {Schema} = mongoose

const cartSchema = new Schema({
    userId :{

        type:Schema.Types.ObjectId,
        ref:"User"
        } ,
    products:[{
        product:{
        type:Schema.Types.ObjectId,
        ref:"Product"
        },
        quantity:{
            type:Number,
            default:1,
            min:1
        },
        price:{
            type:Number,
            min:1
        }

    }],
    productDiscount: {
        type: Number,
        default: 0
    },
    couponApplied: {
        type: Schema.Types.ObjectId,
        ref:"Coupon",
        default: null
    },
        couponDiscount: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },

    
},{ timestamps: true })



const Cart = mongoose.model("Cart",cartSchema)
module.exports = Cart