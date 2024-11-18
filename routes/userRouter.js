const express = require("express")
const router = express.Router()
const passport = require("passport")
const {userauth,adminauth,checkstatus,checkOrderStatus,cacheControl} = require("../middlewares/auth")

const usercontroller = require("../controllers/usercontroller")
const userproductcontroller = require("../controllers/userproductcontoller")
const cartcontroller = require("../controllers/cartcontroller")
const addressController = require("../controllers/addresscontroller")
const userProfileController = require("../controllers/userProfileController")
const orderController = require("../controllers/orderController")
const userCouponController = require("../controllers/usercouponcontroller")
const walletController = require("../controllers/walletController")
// const invoiceController = require("../controllers/invoiceController")

router.use(checkstatus)
router.use(cacheControl);

router.get("/blocked",usercontroller.blockUser)
router.get("/pageNotFound",usercontroller.pageNotFound)
router.get("/",usercontroller.loadhome)
router.get("/signup",usercontroller.loadsignup)
router.post("/signup",usercontroller.signup)
router.post("/otp",usercontroller.verifyOtp)
router.post("/resendotp",usercontroller.resendotp)


router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback",passport.authenticate("google",{ failureRedirect: "/signup" }) ,usercontroller.googleAuthCallback)



router.get("/login",usercontroller.loadlogin)
router.post("/login",usercontroller.login)
router.get("/logout",usercontroller.logout)
router.get("/forgotpassword",(req,res)=>{
    res.render("forgotpassword")
})
router.post("/forgotpassword",usercontroller.forgotpassword)
router.post("/forgotpasswordresendotp",usercontroller.forgotpasswordresendOTP)
router.post("/verifyforgototp",usercontroller.verifyForgotOtp)
router.post("/forgotpasswordchange", usercontroller.forgotpasswordchange)

router.get("/shop/:name",userproductcontroller.getcategories)
router.get("/shop/product/:id",userproductcontroller.getSingleProduct)

router.post("/addwish/:id",userauth,userproductcontroller.addwish)
router.get("/wishlist",userauth,userproductcontroller.loadWishlist)

router.post("/addcart/:id",userauth,cartcontroller.addCart)
router.get("/cart",userauth,cartcontroller.loadCart)
router.post("/cart/updateQuantity/:id",userauth,cartcontroller.quantity)
router.delete("/cart/deleteitem/:id",userauth,cartcontroller.deleteItem)

router.post('/cart/selectPaymentMethod', userauth, cartcontroller.selectPaymentMethod);

router.post('/apply-coupon',userauth,userCouponController.applyCoupon);
router.post('/remove-coupon',userauth,userCouponController.removeCoupon);


router.post("/cart/confirmOrder",userauth,cartcontroller.confirmOrder)
router.post('/cart/verifyPayment',cartcontroller.verifyPayment);
router.post('/cart/retryPayment', userauth, cartcontroller.retryPayment);
router.get("/cart/orderconfirmation",userauth,cartcontroller.orderconfirmation)

router.get("/cart/addaddress",userauth,addressController.addressPage)
router.get("/cart/checkout",userauth,checkOrderStatus,addressController.checkout)
router.post("/cart/checkout",userauth,addressController.selectAddress)
router.post("/addaddress",userauth,addressController.addAddress)


router.get("/userprofile/editprofile",userauth,userProfileController.loadEditUser)
router.post("/userprofile/editprofile",userauth,userProfileController.editUser)
router.get("/userprofile/changepassword",userauth,userProfileController.getchangePassword)

router.post("/userprofile/changepassword",userauth,userProfileController.changePassword)



router.get("/userprofile/addressbook",userauth,userProfileController.addressBook)
router.post("/userprofile/addnewaddress",userauth,userProfileController.addNewAddress)
router.post("/userprofile/addnewaddress",userauth,userProfileController.addNewAddress)
router.get("/userprofile/edit-address/:id",userauth,userProfileController.loadEditAddress)
router.put("/userprofile/edit-address/:id",userauth,userProfileController.updatedAddress)
router.delete("/userprofile/delete-address/:id",userauth,userProfileController.deleteAddress)



router.get("/userprofile/orders",userauth,orderController.orderlist)
router.get("/userprofile/orderdetails/:id",userauth,orderController.orderdetails)
router.get('/download-invoice/:orderId',userauth,orderController.generateInvoice)
router.post('/order/cancel-product',userauth,orderController.cancelProduct);
router.post('/order/return-product',orderController.returnProduct);
router.post('/order/cancel-return',orderController.cancelReturn);

router.get("/userprofile/referal",userauth,userProfileController.loadReferral)
router.post("/apply-referral",userauth,userProfileController.applyReferral)

router.get("/userprofile/wallet",userauth,walletController.getWalletDetails)



// router.get("/admin",adminauth,usercontroller.loadadmin)












router.get("/userprofile",(req,res)=>{
    return res.render("profile")
})
router.get("/demo",(req,res)=>{
    return res.render("salesReport")
})
router.get("/demo",userCouponController.getCoupons
)


module.exports = router;

