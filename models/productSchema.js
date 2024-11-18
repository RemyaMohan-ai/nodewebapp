const mongoose = require("mongoose")
const {Schema}= mongoose

const productSchema = new Schema({
        productName: 
        { type: String,
           required: true 
          },
        description: { 
          type: String,
           required: true
           },
        category: {
            // type: mongoose.Schema.Types.ObjectId, 
            // ref: 'Category', required: true 

              type: String,
            
           },
        brand: { 
            type: String, 
            required: true
           },
        color: { 
            type: String, 
            required: true
           },
        material:{
            type:String,
          },
        price: { 
          type: Number, 
          required: true
         },
        salePrice: { 
            type: Number, 
            required: true
           },
        productOffer:{
            type:Number,
            default:0
        },
        productImage: {
        type: [String],
       
        },
        isBlocked:{
            type: Boolean, 
            default: false  
        },
        isDeleted: {
           type: Boolean, 
           default: false 
          },
        stock: { 
          type: Number,
           default: 0 
          },
        status: { 
             type: String,
            //  enum:["Available","Out of Stock","Unavailable"],
             default: "available"
            },
            

        ratings: { type: Number, 
          default: 0 
        },
        reviews: [{
           user: String,
           review: String, 
           rating: Number 
          }]
      },{timestamps:true});
      
    const product = mongoose.model('Product', productSchema);
      module.exports= product