const mongoose = require("mongoose")
// const {Schema} = mongoose

const couponSchema = new mongoose.Schema({
    code: {
         type: String, 
         required: true, 
        //  unique: true 
        },
    discountType: {
         type: String, 
         enum: ['percentage', 'flat'], 
         required: true 
        },
    discountValue: {
         type: Number, 
         required: true
         },
    maxDiscountValue: {
         type: Number, 
         required: true
         },
    minOrderValue: { 
        type: Number,
         default: 0 
        },

    expiryDate: { 
        type: Date, 
         required: true ,
         get: (date) => {
            return date ? date.toISOString().split('T')[0] : null;
          }
    },
    active: { 
        type: String,
         default: true 
        },
        
        createdAt: { type: Date,
            default: Date.now }
  
})


const Coupon =mongoose.model('Coupon', couponSchema);

module.exports= Coupon