const express = require("express")
const router = express.Router()
const passport = require("passport")
const {userauth,adminauth} = require("../middlewares/auth")


const usercontroller = require("../controllers/usercontroller")

router.get("/pageNotFound",usercontroller.pageNotFound)
router.get("/",usercontroller.loadhome)
router.get("/signup",usercontroller.loadsignup)
router.post("/signup",usercontroller.signup)
router.post("/otp",usercontroller.verifyOtp)
router.post("/resendotp",usercontroller.resendotp)


router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}))
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/signup"}),(req,res)=>{
    res.redirect('/')
})

router.get("/login",usercontroller.loadlogin)
router.post("/login",usercontroller.login)
router.get("/logout",usercontroller.logout)
router.get("/admin",usercontroller.loadadmin)

module.exports = router;