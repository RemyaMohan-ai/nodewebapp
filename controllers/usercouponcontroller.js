const Coupon  = require("../models/couponSchema");
const User  = require('../models/userSchema');
const Cart  = require('../models/cartSchema');




const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('coupons', { coupons }); 
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).render('page404');
    }
};

const applyCoupon = async (req, res) => {
  const { couponCode, totalPrice } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: "Coupon has expired" });
    }
    
    if (totalPrice < coupon.minOrderValue) {
      return res.json({
        success: false,
        message: `You need to spend ₹${(coupon.minOrderValue - totalPrice).toFixed(2)} more to apply this coupon.`,
      });
    }

    

    let discount = coupon.discountType === "flat" ? coupon.discountValue : (coupon.discountValue / 100) * totalPrice;
console.log("discount",discount);

    if (discount > coupon.maxDiscountValue) {
      discount = coupon.maxDiscountValue;
  }
    const finalPrice = totalPrice - discount;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.user._id }, 
      {
        couponApplied: coupon._id,
        couponDiscount: discount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
      },
      { new: true } 
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.json({
      success: true,
      discount: discount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      message: "Coupon applied successfully!",
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: req.user },
      {
        couponApplied: null,     
        couponDiscount: 0,          
        finalPrice: req.body.totalPrice.toFixed(2),
      },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    return res.json({
      success: true,
      message: "Coupon removed successfully!",
      finalPrice: updatedCart.finalPrice, 
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};




module.exports={
    getCoupons,
    applyCoupon,
    removeCoupon
}