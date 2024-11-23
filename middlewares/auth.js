const User = require("../models/userSchema")
const userauth =async (req,res,next)=>{
        try {

          if (!req.session.user) {
            return res.redirect("/login");
          }
      
          const user = await User.findById(req.session.user);
      
          if (!user || user.isBlocked) {
            console.log("User not found or blocked");
            req.session.destroy((err) => {
              if (err) console.error("Error destroying session:", err);
            });
            return res.redirect("/login");
          }
      
          req.user = user;
          
          next();
        } catch (error) {
          console.error("Error in user authentication middleware:", error);
          res.status(500).json({ message: "Internal server error" });
        }
    };


const adminauth = (req,res,next)=>{
    User.findOne({isAdmin : true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/login")
            console.log("data not found at adminauth");
            
        }
    }).catch(error=>{
        console.log("error in adminauth");
        res.status(500).send("internal server error")
    })

}


const checkstatus =  (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(user=>{
            if(user&&user.isBlocked){
                req.session.destroy(err=>{
                    if(err){
                        console.log("Error destroying session:", err);
                        res.status(500).send("Internal server error");
                    }else {
                        res.redirect('/blocked',{message:"account has been blocked"}); // Redirect to blocked page
                    }
                })
                
            }else{
                next()
            }
        })
        .catch(error=>{
            console.log("Error fetching user:", error);
            res.status(500).send("Internal server error");
        })
    }else {
        next();
    }
};

// const checkOrderStatus = async (req, res, next) => {
//     try {
//         const userId = req.session.user; 
//         const orderId = req.session.orderId;
        
//         if (orderId) {
//             return res.redirect('/cart'); 
//         }
        
//         next();
//     } catch (error) {
//         console.error("Error checking order status:", error);
//         return res.status(500).send("Internal server error");
//     }
// };



const cacheControl = (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};


module.exports={
    userauth,
    adminauth,
    checkstatus,
    // checkOrderStatus,
    cacheControl
}