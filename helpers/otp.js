const nodemailer = require("nodemailer")
const generateOTP = ()=>{
    otp = Math.floor(Math.random()*1000000)
    otp = otp.toString().padStart(6,'0')
    return otp
}
// console.log(generateotp());

const sendOTP  =async (email,OTP)=>{
  try {
    
  
    const transport = nodemailer.createTransport({
        service:"gmail",
        auth : {
            user : process.env.EMAIL_SERVICE_USER,
            pass:process.env.EMAIL_SERVICE_PASS
        }
    })

    const mailOptions = {
        from:process.env.EMAIL_SERVICE_USER,
        to:email,
        subject:"OTP for account regiter",
        text:`Your one time pssword for registering LOUNGELUX is ${OTP} `
    }

      transport.sendMail(mailOptions);
      console.log("email sent successfully to mail id",email);
      return true;
} catch (error) {
  console.error("Error sending OTP email:", error);
  return false;
}
};



module.exports = { generateOTP, sendOTP };