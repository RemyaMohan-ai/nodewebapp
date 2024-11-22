const product = require("../models/productSchema")
const Wishlist = require("../models/wishlist")
const Cart = require("../models/cartSchema")
const User = require("../models/userSchema");
const Address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const Coupon = require("../models/couponSchema")


const Razorpay = require("razorpay")
const crypto = require('crypto');

const{RAZORPAY_ID_KEY ,RAZORPAY_KEY_SECRET} =  process.env;


const razorpayInstance = new Razorpay({
    key_id:  RAZORPAY_ID_KEY ,
    key_secret: RAZORPAY_KEY_SECRET,
});


const addCart = async (req, res) => {
    try {  
        if (!req.session.user) {
            return res.redirect("/login");
        }
        const userId = req.session.user;

        const productId = req.params.id;
        const addingProduct =await product.findOne({_id:productId})
        if(!addingProduct){
            return res.status(404).json({ message: "Product not found" });
        
        }
        const availableStock=  addingProduct.stock
        if (availableStock<= 0) {
            return res.status(400).json({ message: "Product is out of stock" });
        }
        let cartItem = await Cart.findOne({ userId }).populate('products.product');
        
        if (!cartItem) {
            cartItem = new Cart({ userId, products: [] });
            await cartItem.save();
        }

        const productIndex = cartItem.products.findIndex(item => item.product._id.toString() === productId);

        if (productIndex > -1) {
            const currentQuantity = cartItem.products[productIndex].quantity;
            
            if (currentQuantity + 1 > availableStock) {
                return res.status(400).json({ message: `Only ${availableStock} items left in stock` });
            }
            
            cartItem.products[productIndex].quantity += 1;
        } else {
            cartItem.products.push({
                product: productId,
                quantity: 1,
                price:addingProduct.salePrice
            });
        }
        
        await cartItem.save();

        if (productIndex > -1) {
            return res.status(200).json({ message: "Product quantity increased in cart" });
        } else {
            return res.status(200).json({ message: "Product added to cart" });
        }




        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error", error });

        
    }
}


const loadCart = async (req, res) => {
    
    try {
        const userId = req.session.user;
        req.session.checkout=true
        if (!userId) {
            return res.redirect("/login");
        }

        const userData = await User.findOne({ _id: userId });
        if (!userData) {
            console.warn("User not found:", userId);
            return res.redirect("/login");
        }
        delete req.session.orderId;

        const cartItem = await Cart.findOne({userId }).populate('products.product');

        if (!cartItem || cartItem.products.length === 0) {
            return res.render("cart", {
                user: userData,
                cartProducts: [],
                totalPrice: 0,
                emptyCart: true 
            });
        }

        cartItem.couponApplied = null;
        cartItem.couponDiscount = 0;
        
        const cartProducts = cartItem ? cartItem.products : [];
        const totalPrice = cartItem.products.reduce((total, item) => {
            const salePrice = parseFloat(item.product.salePrice) || 0; // Access salePrice from populated product
            const quantity = parseInt(item.quantity, 10) || 0;
            return total + (salePrice * quantity);
        }, 0);
        console.log(totalPrice);
        const productDiscount =cartItem.products.reduce((offer, item) => {
            const salePrice = parseFloat(item.product.salePrice) || 0; // Access salePrice from populated product
            const price = parseFloat(item.product.price) || 0; // Access salePrice from populated product
            const quantity = parseInt(item.quantity, 10) || 0;
            return offer + ((price-salePrice )* quantity);
        }, 0);
        cartItem.totalPrice = totalPrice;
        cartItem.finalPrice = totalPrice;
        cartItem.productDiscount = productDiscount;
        await cartItem.save()
        const today = new Date()
        today.setHours(0, 0, 0, 0);
        const coupons =  await Coupon.find({expiryDate:{$gt:today }});
        console.log("carrtpage showing");


        return res.render("cart", {
            user: userData,
            cartProducts,
            totalPrice,
            productDiscount,
            coupons,
            emptyCart: false 
        });

    } catch (error) {
        console.log("error", error);
       return res.status(500).send("Internal Server Error");
    }
}


const quantity = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user;
        const { action } = req.body;

        const cart = await Cart.findOne({ userId }).populate('products.product');
        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }

        const productItem = cart.products.find(item =>  item._id.toString()=== productId);
        if (!productItem) {
            return res.status(400).json({ message: "Product not found in cart" });
        }

        const eachProduct = productItem.product;
        const availableStock = eachProduct.stock;
        const currentQuantity = productItem.quantity;

        console.log("Product:", eachProduct, "Available stock:", availableStock, "Current quantity:", currentQuantity);

        if (action === "increment") {
            if (currentQuantity >= availableStock) {
                return res.status(400).json({ success: false, message: `Only ${availableStock} items left in stock` });
            }
            if (currentQuantity >= 10) {
                return res.status(400).json({ success: false, message: "Maximum quantity per product is 10" });
            }
        }

        if (action === "decrement") {
            if (currentQuantity === 1) {
                return res.status(400).json({ message: "Quantity cannot be less than 1" });
            }
        }

        const value = action === 'increment' ? 1 : -1;

        const result = await Cart.updateOne(
            { userId, "products._id": productId },
            { $inc: { "products.$.quantity": value } }
        );

                    console.log(result);
                    
        if (result.nModified === 0) {
            return res.status(400).json({ message: "Failed to update cart" });
        }

        return res.status(200).json({ success: true, message: action === 'increment' ? "Quantity increased" : "Quantity decreased" });

    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const deleteItem = async (req,res)=>{
    try {
        const productId = req.params.id
        const userId = req.session.user
        const result = await Cart.updateOne({userId,"products._id":productId},{$pull:{products:{_id:productId}}})
        return res.json({success:true, message: "Product removed from cart"})
    } catch (error) {
        console.log(error);
        
    }
}


const selectPaymentMethod = (req, res) => {
    try {
        req.session.paymentMethod = req.body.paymentMethod;
        res.json({ success: true });
    } catch (error) {
        console.error("Payment method selection error:", error);
        res.status(500).json({ success: false, message: 'Failed to select payment method.' });
    }
};


const reduceStock = async (products) => {
    for (const item of products) {
        const Product = await product.findById(item.product);
        if (!Product || Product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${Product?.productName || 'a product'}`);
        }
        Product.stock -= item.quantity;
        await Product.save();
    }
};

const createOrder = async (user, cart, address, paymentMethod, paymentStatus, razorpayOrderId = null, razorpayPaymentId = null) => {
    let productDetails;
    if (cart.couponDiscount && cart.couponDiscount !== 0) {
        const totalPrice = cart.totalPrice;
        const couponDiscount = cart.couponDiscount;

        productDetails = cart.products.map(item => {
            const productPrice = item.price;
            const productQuantity = item.quantity;

            const totalItemPrice = productPrice * productQuantity;

            const itemDiscount = (totalItemPrice / totalPrice) * couponDiscount;

            const newItemPrice = (totalItemPrice - itemDiscount) / productQuantity;

            return {
                productId: item.product,
                quantity: item.quantity,
                price: parseFloat(newItemPrice.toFixed(2)), 
            };
        });
    } else {
        productDetails = cart.products.map(item => ({
            productId: item.product,
            quantity: item.quantity,
            price: item.price,
        }));
    }

    return new Order({
        userId: user,
        orderNumber: generateOrderNumber(),
        productDetails,
        orderingAddress: address,
        couponDiscount: cart.couponDiscount || 0,
        productDiscount: cart.productDiscount || 0,
        totalDiscount: (cart.productDiscount || 0) + (cart.couponDiscount || 0),
        totalPrice: cart.totalPrice,
        finalPrice: cart.finalPrice,
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
    });
};



const generateOrderNumber = () => 'ORD-' + Math.floor(100000 + Math.random() * 900000);


const confirmOrder = async (req, res) => {
    try {
        const { user, selectedAddress, paymentMethod } = req.session;

        if (!selectedAddress || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing address or payment method.' });
        }

        const cart = await Cart.findOne({ userId: user });
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: 'Empty cart.' });
        }
        

        if (paymentMethod === 'online-payment') {
            const amountInPaise = cart.finalPrice * 100;
            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: 'order_rcptid_' + Math.floor(100000 + Math.random() * 900000),
                payment_capture: 1
            };

            const razorpayorder = await razorpayInstance.orders.create(options);
            if (!razorpayorder) {
                return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
            }
            console.log("razorpayorder",razorpayorder.id);

            const razorpayOrderId = razorpayorder.id

            req.session.razorpayOrderId = razorpayorder.id;

            const newOrder = await createOrder(user, cart, selectedAddress, paymentMethod,'Payment Pending',razorpayOrderId);
            req.session.orderId =newOrder._id


            // for (const item of cart.products) {
            //     const Product = await product.findById(item.product);
            //     if (!Product || Product.stock < item.quantity) {
            //         return res.status(400).json({ success: false, message: `Insufficient stock for ${Product.productName}` });
            //     }
            //     Product.stock -= item.quantity;
            //     await Product.save();
            // }

            
             await reduceStock(cart.products)
            
            newOrder.paymentStatus  = "Payment Pending"; 
            await newOrder.save();
            if(newOrder){
                await Cart.deleteOne({ userId: req.session.user });

            }

            return res.json({
                success: true,
                razorpayOrderId: razorpayorder.id,
                amount: amountInPaise,
                currency: 'INR',
                user: { name: user.name, email: user.email },
                razorpayKey: process.env.RAZORPAY_ID_KEY
            });
        }

        else if(paymentMethod === 'Cash on Delivery'){
            const newOrder = await createOrder(user, cart, selectedAddress, paymentMethod,'cash on delivery');

            


            await reduceStock(cart.products)
            await newOrder.save();
            req.session.orderId = newOrder._id;
            await Cart.deleteOne({ userId: user });
    
            res.json({ success: true ,message:' order placed with Cas On Delivery '});
        
        }
       } catch (error) {
        console.error("Error in confirmOrder:", error);
        res.status(500).json({ success: false, message: 'Failed to place order.' });
    }
};





const verifyPayment = async (req, res) => {
    try {
        const {razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        console.log("razorpayOrderId, razorpayPaymentId, razorpaySignature",razorpayOrderId, razorpayPaymentId, razorpaySignature);
        
    if(!razorpayPaymentId){
        console.log("Payment unsuccessful. No payment ID received. Please try again.");

        return res.json({ success: true, message: 'Payment verification failed. Redirecting to order confirmation.', redirect: true });

    }
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
        const generatedSignature = hmac.digest("hex");

        console.log("generatedSignature",generatedSignature,"razorpaySignature",razorpaySignature);
    
        if (generatedSignature === razorpaySignature) {
            
            const updatedOrder = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpayOrderId },
                { paymentStatus: 'Paid', razorpayPaymentId },
                { new: true }
            );
            console.log("updatedOrder",updatedOrder);
            if(!updatedOrder) {
                return res.status(400).json({ success: false, message: 'Order not found' });
            }

            req.session.orderId = updatedOrder._id;
            return res.json({ success: true ,message: 'Payment Successful' });
        } else {
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpayOrderId },
                { paymentStatus: 'Payment Pending' }
            );
            console.log("Payment verification failed, status updated to Payment Pending.");
            
            return res.json({
                success: false,
                message: 'Payment verification failed. Redirecting to order confirmation.',
                redirect: true
            });
        }


    } catch (error) {
        console.error("Failed to update order payment status:", error);
        return res.status(500).json({ success: false, message: 'Internal server error' });

    }
    }
    

const retryPayment = async (req, res) => {
        try {
            const { orderId } = req.body;
            
            const order = await Order.findById(orderId)
            .populate('userId')
            ;
            console.log("userIdorderId",order);
            
            if (!order || order.paymentStatus !== 'Payment Pending') {
                return res.status(400).json({ success: false, message: 'Order not available for retry or already paid.' });
            }
            
            res.json({
                success: true,
                razorpayOrderId: order.razorpayOrderId,
                amount: order.totalPrice * 100, // in paise
                currency: 'INR',
                user: { name: order.userId.name, email: order.userId.email },
                razorpayKey: process.env.RAZORPAY_ID_KEY
            });
        } catch (error) {
            console.error("Error in retryPayment:", error);
            res.status(500).json({ success: false, message: 'Failed to fetch order for retry.' });
        }
    };
    



const orderconfirmation = async (req, res) => {
    try {
        req.session.checkout=false

        if (req.session.orderId) {
            const orderdetails = await Order.findOne({ _id: req.session.orderId })
                .populate('userId')
                .populate('productDetails.productId');
            const addressDocument = await Address.findOne({ 'address._id': orderdetails.orderingAddress }, { 'address.$': 1 });
            const orderingAddress = addressDocument ? addressDocument.address[0] : null;
        
            delete req.session.selectedAddress;
            delete req.session.paymentMethod;
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');



       
        if (!orderdetails) {
            console.log("orderdetails is empty");
            
        }else{
            console.log("orderdetails",orderdetails);
            
        }
       

            res.render("orderconfirmation", {
                orderdetails,
                orderingAddress
            });
        } else {
            console.log("Order session not found");
            res.redirect('/cart');

        }
    } catch (error) {
        console.log("Confirmation error:", error);
        res.status(500).send("An error occurred while confirming the order.");
    }
};


module.exports={
    loadCart,
    addCart,
    quantity,deleteItem,
    selectPaymentMethod,
    confirmOrder,
    verifyPayment,
    orderconfirmation,
    retryPayment,
    // updateorderStatus
    
}