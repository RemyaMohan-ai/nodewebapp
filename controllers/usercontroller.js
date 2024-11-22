const User = require("../models/userSchema")
const product = require("../models/productSchema")
const Order = require("../models/orderSchema")
const changepassword = require("./userProfileController")
const Wallet = require("../models/walletSchema")
const bcrypt = require("bcrypt")
const env = require("dotenv").config()

const passport = require("passport");


const {generateOTP,sendOTP,generateReferralCode} = require("../helpers/otp")

const securepass = async (password)=>{
    try {
        const hashpassword= await bcrypt.hash(password,10)
      return hashpassword
    } 
      
    catch (error) {
       console.log("error in password hashing") 
    }}


const pageNotFound = async (req,res)=>{
   try {
    res.render("page 404")
   } catch (error) {
    res.redirect("/pageNotFoundound")
   }
}

const blockUser = async (req,res)=>{
    try {
        res.send("UserBlocked")
    } catch (error) {
        console.log("error in rendering the blocked page",error);
        
    }
}
const loadhome = async (req, res) => {
    try {
        const userId = req.session.user;
        console.log("User ID:", userId);

        let userData = null;
        if (userId) {
            userData = await User.findOne({ _id: userId });
            if (!userData) {
                console.warn("User not found:", userId);
            }
        }

        const loveSeat = await product.aggregate([
            { $match: { category: "Love Seats",isDeleted: false } },
            { $sample: { size: 1 } }
        ]);

        const recliners = await product.aggregate([
            { $match: { category: "Recliners",isDeleted: false  } },
            { $sample: { size: 1 } }
        ]);

        const sectional = await product.aggregate([
            { $match: { category: "Sectional Sofa",isDeleted: false  } },
            { $sample: { size: 1 } }
        ]);

        const nordic = await product.aggregate([
            { $match: { category: "Nordic Chairs" ,isDeleted: false } },
            { $sample: { size: 1 } }
        ]);

        const randomProduct = {
            loveSeat: loveSeat[0] || null,
            recliners: recliners[0] || null,
            sectional: sectional[0] || null,
            nordic: nordic[0] || null
        };
        const bestSellingProducts = await Order.aggregate([
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.productId",
                    totalSold: { $sum: "$productDetails.quantity" },
    
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 8},
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    productImage:"$productInfo.productImage",
                    productName: "$productInfo.productName",
                    productPrice: "$productInfo.salePrice",
                    productOffer: "$productInfo.productOffer",
                    productId: "$productInfo._id",
                   
                }
            }
        ]);
    // console.log("bestSellingProducts",bestSellingProducts);
    
    const slider1 = bestSellingProducts.slice(0, 4); // First 4 products
    const slider2 = bestSellingProducts.slice(4, 8); // Next 4 products
    
        return res.render("home", { user: userData, randomProduct,slider1,slider2,bestSellingProducts });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).redirect("/pageNotFound");
    }
}

const loadlogin =  async (req,res)=>{
    try {
         res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        if (req.session.user || req.session.admin) {
            return res.redirect(req.session.admin ? "/admin" : "/");
        }

        res.render("login");

        
        
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound")
        
    }
}



const googleAuthCallback = (req, res) => {
    console.log("User authenticated and session created:", req.user);

    req.session.user = req.user._id;

    res.redirect('/');
};








const loadsignup =  async (req,res)=>{
    try {
        if(!req.session.user){
        return res.render("signup")
        }else{
            res.redirect("/home")
        }
    } catch (error) {
        res.status(500).send("server error")
        console.log();
    }
}
     

const signup = async (req,res)=>{
    try {
        const {name,mobile,email,password,confirmpassword}=req.body

        const finduser =await User.findOne({email:email})
        console.log("finduser",finduser);
        if(finduser){
             console.log("user exists");
           return res.render("signup",{message:"user already exists"})
          
        }
        const otp = await generateOTP()
        console.log("otp",otp);
        const emailsent = await sendOTP(email, otp);
        if(!emailsent){
            return res.json("emailing error")
        }
        req.session.userotp = otp
        req.session.userData = {name,email,password,mobile};
        console.log("OtP Sent",otp);
        return res.render("otp")
        
    } catch (error) {
        console.error("signup error",error);
        if (!res.headersSent) { 
            console.log("notworking");
            res.redirect("/pageNotFound");
        }    }    
}   


const verifyOtp =async (req,res)=>{
    try {
        console.log("session",req.session.userotp);
        
        if (!req.session.userotp) {
            return res.status(400).json({ success: false, message: "OTP not found in session. Please request a new OTP." });
        }
        const {otp} = req.body;
        const { otp: sessionOtp, otpExpiration } = req.session.userotp;

        if (Date.now() > otpExpiration) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        console.log(otp);
        if(otp==sessionOtp){
            const user = req.session.userData
            const hashpassword = await securepass(user.password);
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                mobile:user.mobile,
                password:hashpassword,
                referralCode: generateReferralCode(),
            })
            await saveUserData.save()
            req.session.user=saveUserData._id;
            const wallet = new Wallet({ userId:saveUserData._id });
            await wallet.save();

            res.json({success:true, redirecturl:"/"})
    }else{
        res.status(400).json({success:false ,message:"Invalid OTP"})
    }
 } catch (error) {
        console.error("error verifying otp",error);
        res.status(500).json({success:false ,message:"error occured in verifying OTP"})

    }
}

const resendotp =async (req,res)=>{
    try {
        
    const {email} = req.session.userData;
    if(!email){
        return res.status(400).json({succes:false,message:"Email not found in session"})
    }
    const otp = generateOTP()
    const otpExpiration = Date.now() + 5 * 60 * 1000; 
    req.session.userotp = { otp, otpExpiration };

    const emailsent = await sendOTP(email, otp);
    if(emailsent){
        console.log("resend otp",otp);
        res.status(200).json({success:true,message:"OTP Resend"})
    }else{
        res.status(500).json({success:false,message:"Failed to send otp"})
    }
} catch (error) {
    console.log("Error resending OTP",error);
    res.status(500).json({success:false,message:"Internal sever error"})
}

}

const login = async (req,res)=>{
    try {
        const{email,password}=req.body;
        if(email==""||password==""){
            return res.render("login",{message:"please enter valid email and password "})
        }
        const finduser = await User.findOne({email:email})

        if (req.session.user) {
            return res.redirect("/");
        } else if (req.session.admin) {
            return res.redirect("/admin");
        }
        if(!finduser){
            return res.render("login",{message:"User not Found"})
        }
        if(finduser.isBlocked){
            return res.render("login",{message:"Blocked User"})
        }
        const passwordmatch = await bcrypt.compare(password,finduser.password)
        if(!passwordmatch){
            
            return res.render("login",{message:"Incorrect email and password"})
        }
        if(finduser.isAdmin ){
            req.session.admin=true
            return res.redirect("/admin")
          }
          
          console.log("User name:", finduser.name);

        req.session.user = finduser.id;
        console.log("session",req.session.user);
        
        res.redirect("/")
    } 
    catch (error) {
        console.log("login Error",error);
        res.render("login",{message:"login Failed"})
    }
}



const forgotpassword = async (req,res)=>{
    try {
        const { email }= req.body
        console.log(email);
        const userdetail = await User.findOne({email:email})
        console.log(userdetail);
        req.session.forgotpasswordemail=email
        if(!userdetail){
            return res.status(400).json({message:"User Not found"})
        }
        const forgototp = await generateOTP()
        console.log("otp",forgototp);
        const emailsent = await sendOTP(email, forgototp);
        if(!emailsent){
            return res.json("emailing error")
        }
        req.session.userforgototp = forgototp
        console.log("session otp",req.session.userforgototp);
        console.log("session email",req.session.forgotpasswordemail);
        
        console.log("OtP Sent",otp);
        res.status(200).json({ success: true, message: "OTP sent to your email." });

        
    } catch (error) {
        console.error("Error in forgotpassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }

}

 const forgotpasswordresendOTP = async (req, res) => {
    try {
        const email = req.session.forgotpasswordemail;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found. Please request OTP again." });
        }

        const userdetail = await User.findOne({ email: email });
        if (!userdetail) {
            return res.status(400).json({ success: false, message: "User not found." });
        }

        const forgototp = await generateOTP();
        console.log("New OTP generated:", forgototp);

        const emailsent = await sendOTP(email, forgototp);
        if (!emailsent) {
            return res.status(500).json({ success: false, message: "Error sending OTP. Please try again later." });
        }

        req.session.userforgototp = forgototp;
        console.log("New OTP stored in session:", req.session.userforgototp);

        res.status(200).json({ success: true, message: "New OTP sent successfully." });
    } catch (error) {
        console.error("Error in resendOTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const verifyForgotOtp = async (req,res)=>{
    try {
        const {otp} = req.body;
        console.log("comingotp",otp);
        const sessionforgototp = req.session.userforgototp
        console.log("sessionforgototp",sessionforgototp);
        
        if(sessionforgototp!=otp){
            return res.status(400).json({message:"OTP doesnot Match found"})
        }
        res.status(200).json({ success: true, message: "Change Password." });


    } catch (error) {
        console.error("Error in forgotpassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}



const forgotpasswordchange = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const email = req.session.forgotpasswordemail;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email: email }, { $set: { password: hashedPassword } });

        req.session.user = user.id;
        console.log("session",req.session.user);
        
        res.redirect("/")
        // res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const logout = async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
            console.log("session destruction error");
            return res.redirect("/pageNotFound")
            }
        return res.redirect("/login")
     })
    } catch (error) {
        console.log("logout error",error);
        res.redirect("/pageNotFound")
        
        
    }
}

// const loadadmin = async (req,res)=>{
//     if(!req.session.admin){
//         return res.redirect('/login')
//     }
//     return res.render("admindashboard")
// }

module.exports={
    loadhome,
    pageNotFound,
    loadlogin,
    login,
    loadsignup,
    signup,
    verifyOtp,
    resendotp,
    forgotpassword,
    forgotpasswordresendOTP,
    verifyForgotOtp,
    logout,
    // loadadmin,
    blockUser,
    googleAuthCallback,forgotpasswordchange
}