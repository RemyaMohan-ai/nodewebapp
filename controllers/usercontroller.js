const User = require("../models/userSchema")
const bcrypt = require("bcrypt")
const env = require("dotenv").config()

const {generateOTP,sendOTP} = require("../helpers/otp")
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

const loadhome = async (req,res)=>{
    try {
        const user = req.session.user;
        if(user){
            const userData =await User.findOne({_id:user._id})
            return res.render("home",{user:userData})

        }else{

        return res.render("home")  
        }

    } catch (error) {
        res.status(500).send("server error")
        console.log();
    }
}

const loadlogin =  async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login")
        }
        else{
            res.redirect("/")
        }
    } catch (error) {
        console.log();
        res.redirect("/pageNotFound")
        
    }
}

const loadsignup =  async (req,res)=>{
    try {
        return res.render("signup")
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
        const {otp} = req.body;
        console.log(otp);
        if(otp==req.session.userotp){
            const user = req.session.userData
            const hashpassword = await securepass(user.password);
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                mobile:user.mobile,
                password:hashpassword
            })
            await saveUserData.save()
            req.session.user=saveUserData._id;
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
    req.session.userotp = otp;
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

        const finduser = await User.findOne({email:email})
        if(!finduser){
            return res.render("login",{message:"User not Found"})
        }
        if(finduser.isBlocked){
            return res.render("login",{message:"Blocked User"})
        }
        const passwordmatch = await bcrypt.compare(password,finduser.password)
        if(!passwordmatch){
            
            return res.render("login",{message:"Incorrect password and password"})
        }
        if(finduser.isAdmin ){
            req.session.admin=true
            return res.redirect("/admin")
          }
          

        req.session.user = finduser.id;
        res.redirect("/")
    } 
    catch (error) {
        console.log("login Error",error);
        res.render("login",{message:"login Failed"})
    }
}

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

const loadadmin = async (req,res)=>{
    if(!req.session.admin){
        return res.redirect('/login')
    }
    return res.render("admindashboard")
}

module.exports={
    loadhome,pageNotFound,
    loadlogin,login,
    loadsignup,signup,
    verifyOtp,
    resendotp,
    logout,
    loadadmin
}