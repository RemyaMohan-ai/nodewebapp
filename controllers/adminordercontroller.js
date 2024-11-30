const Order = require('../models/orderSchema'); 
const Address = require("../models/addressSchema")
const Wallet = require("../models/walletSchema")
const Product = require("../models/productSchema")


const getAllOrders = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1; 
        let limit = 5;
        let skip = (page - 1) * limit; 

        const orders = await Order.find().populate('productDetails.productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        const totalorders= await Order.countDocuments(); 
        const totalPages = Math.ceil(totalorders / limit);

        res.render('orderlist', { 
            orders,
            totalPages: totalPages,
            currentPage: page
         });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, productId, orderStatus,deliveryDate,quantity } = req.body;
        
        const order = await Order.findById(orderId)
        const userId = order.userId
        console.log("userId",userId);
        
        const userWallet = await Wallet.findOne({userId:userId})
        
        if(!userWallet){
            console.log("wallet not found");

        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const product = order.productDetails.find(products => products.productId.toString() === productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in order' });
        }
         const productName = product.productName
        product.orderStatus = orderStatus;
        if (deliveryDate) {
            product.deliveryDate = deliveryDate; 
        }

        if(product.orderStatus=="Returned"){
            const incrementStock = await Product.findByIdAndUpdate(
                { _id: productId },
                { $inc: { stock: product.quantity } },
                { new: true } 
            );
        

            const returnAmount = product.price*product.quantity; 
            console.log("returnAmount,userWallet.balance ",userWallet.balance, returnAmount);
            
            userWallet.balance += parseFloat(returnAmount);
          
            userWallet.transactions.push({
              type: 'credit',
              amount: returnAmount,
              description: `Refund for returned product: ${product._id}`,
            });
          
            await userWallet.save();
        }

        await order.save();
       

        res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
};


const getOrderDetails = async (req,res)=>{
    try {
        const orderId = req.params.orderId
        const orderdetails = await Order.findOne({_id:orderId})
        .populate({path:"productDetails.productId",
            select:"productName salePrice price productImage"
        });
        const addressdetails = await Address.findOne({"address._id":orderdetails.orderingAddress},{'address.$':1})

        const orderedaddress=addressdetails?addressdetails.address[0]:null

console.log("orderedaddress",orderedaddress);


        console.log("orderdetails",orderdetails);
        res.render("orderdetails",
            {orderdetails,orderedaddress}
        )
    } catch (error) {
        console.log(error)
        res.status(500).redirect('/pageNotFound');
        
    }
}


module.exports = {
    getAllOrders,
    updateOrderStatus,getOrderDetails
};
