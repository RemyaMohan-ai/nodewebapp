const User = require("../models/userSchema")
const userauth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data&&!data.isBlocked){
                next()
            }else{
                res.redirect("/login")
                console.log("error occure in datafetching in middlewAare auth");
                
            }
        })
        .catch(error=>{

            console.log("error occured in userauth");
            res.status(500).send("internal server Error")
        })
    }else{
        res.redirect("/login")
        console.log("session not found in userrmiddleware");
        
    }
}

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


module.exports={
    userauth,
    adminauth

}