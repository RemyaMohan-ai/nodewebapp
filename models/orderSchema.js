const mongoose = require("mongoose");
const {Schema} = mongoose;
const orderSchema = new Schema({
 userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  orderNumber: { 
    type: String,
  },

  productDetails: [{
    productId: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true 
    },

    quantity: { 
      type: Number,
      required: true 
    },

    price: {
       type: Number, 
    },

    orderStatus: {
      type: String,
      enum: ['Pending','Confirmed','Shipping', 'Delivered','Cancelled','Partially Cancelled',  "Return Requested", 'Return Initiated','Returned','Return cancelled'],
       default: 'Pending' 
     },

     cancellationquantity:{
      type:Number,
      default:0
    },

     cancellationreason:{
      type:String,
      default:""
    },

    deliveryDate:{
      type:Date,
      default:null
    },
    returnQuantity:{
      type:Number,
      default:0
    },
    
    returnReason:{
      type:String,
      default:""
    },
  }],

  orderingAddress: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Address',
     required: true 
    },

  totalPrice: { 
    type: Number,
     required: true
     },

  paymentMethod: {
     type: String,
      default: 'Cash on Delivery' 
    },

  paymentStatus:{
      type:String,
      enum: [ 'Paid', 'Payment Pending', 'Refunded','cash on delivery'],
      default:""
  },
  
    couponCode: { 
      type: String 

    },
    productDiscount: {
       type: Number

    },
    couponDiscount: {
       type: Number

    },
    totalDiscount: {
       type: Number

    },

    finalPrice: { 
      type: Number,
      required: true
    }, 

    razorpayOrderId:{
      type:String,
      default:""
    },

    razorpayPaymentId:{
      type:String,
      default:""
    },

    refundAmount: { 
      type: Number,
      default:0,

    },
    
    createdAt: {
       type: Date,
       default: Date.now

     },

})


const Order =mongoose.model('Order', orderSchema);
module.exports = Order