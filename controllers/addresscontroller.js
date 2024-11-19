const Address = require("../models/addressSchema")
const Cart = require("../models/cartSchema")
const User = require("../models/userSchema")
const Order = require("../models/orderSchema")

const addressPage = async (req,res)=>{
    try {
        const userId= req.user._id;

        const addresses = await Address.findOne({userId})
        let addresslist = addresses?addresses.address:null
        res.render("addaddress",{
            address:addresslist
        })
    } catch (error) {
        console.log(error);
        
    }
    
}


const checkout = async (req, res) => {
    if(!req.session.checkout){
        res.redirect("/cart")
    }
    try {
        
        const userId = req.user._id;
        const user = await User.findOne({_id:userId})
        const addressDocument = await Address.findOne({ userId });
        const cartItem =  await Cart.findOne({userId });
       
        if (!cartItem) {
            console.log("cart is empty");
            
            return res.redirect("/cart");
        }

        if(req.session.ordeId){
            var order = await Order.findOne({orderId:req.session.ordeId})
        }
        
        const finalPrice = cartItem.finalPrice||0
        console.log("finalPrice,cartItem" ,finalPrice,cartItem);
        
       
        
        console.log("cartItem",cartItem);
        
        if (!addressDocument || !addressDocument.address || addressDocument.address.length === 0) {
            return res.render("checkout", { address: null, addresses: [] });
        }

        let selectedAddress;

        if (req.session.selectedAddress) {
            selectedAddress = addressDocument.address.find(addr => addr._id.toString() === req.session.selectedAddress);
            console.log("selectedAddress",selectedAddress);
            
        } else {
            selectedAddress = addressDocument.address[addressDocument.address.length - 1];
            req.session.selectedAddress = selectedAddress._id.toString();
        }

        
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
console.log(" finalPrice:cartItem.finalPrice,",cartItem.finalPrice,);

        res.render("checkout", {
            address: selectedAddress,
            addresses: addressDocument.address,
            finalPrice:cartItem.finalPrice,
            user:user,
            order:order
        });
    } catch (error) {
        console.error("Error in checkout:", error);
        res.status(500).render('page 404');
    }

};










const selectAddress = async (req, res) => {
    try {
        const selectedAddressId = req.body.selectedAddress;

        req.session.selectedAddress = selectedAddressId;
        console.log("req.session.selectedAddress ",req.session.selectedAddress );
        
        res.redirect('/cart/checkout');
    } catch (error) {
        console.error("Error selecting address:", error);
        res.status(500).render('page 404');
    }
};





const addAddress = async (req, res) => {
    try {
        const { name, altPhone, phone, email, building, addresslane, city, state, pincode, landMark } = req.body;
        if (!name || !phone || !addresslane || !city || !pincode) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const updatedUser = await Address.findOneAndUpdate(
            { userId: req.user._id },
            {
                $addToSet: {
                    address: {
                        name,
                        phone,
                        altPhone,
                        email,
                        building,
                        addresslane,
                        city,
                        state,
                        landMark,
                        pincode
                    }
                }
            },
            { new: true, upsert: true }
        );

        const newAddress = updatedUser.address[updatedUser.address.length - 1];
        req.session.selectedAddress = newAddress._id;
        res.status(200).json({ message: 'Address added successfully', newAddress });

        // res.redirect('/cart/checkout');
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error: error.message });
    }
};


module.exports={
    addressPage,
    addAddress,checkout,
    selectAddress
}