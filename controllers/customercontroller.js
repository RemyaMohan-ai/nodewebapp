


const User = require("../models/userSchema")



const customerInfo = async (req,res)=>{
    try {
        let search =""
        if(req.query.search){
            search=req.query.search
        }
        let page=1;
        if(req.query.page){
            page =parseInt(req.query.page) 
        }

        const limit= 5
        const userData =await User.find({
            isAdmin:false,
            $or:[{name:{$regex:".*"+search+".*",$options:"i"}}],
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count = await User.find({
            isAdmin:false,
            $or:[{name:{$regex:".*"+search+".*",$options:"i"}}],
        }).countDocuments();
        console.log("userdata :",userData);
        
    res.render("userlist",{
        data:userData,
        totalPages:Math.ceil(count/limit),
        currentPage:page
    })
    } catch (error) {
        console.log("error in loading userlist page");
        res.redirect("/pageerror")
        
    }
}

const customerBlocked = async (req,res)=>{
    try {
       let id = req.query.id
       await User.updateOne({_id:id},{$set:{isBlocked:true}})
       res.redirect("/admin/users")
    } catch (error) {
        console.log("block failed");
        res.redirect("/pageerror")      
    }
}
const customerUnblock = async (req,res)=>{
    try {
       let id = req.query.id
       await User.updateOne({_id:id},{$set:{isBlocked:false}})
       res.redirect("/admin/users")
    } catch (error) {
        console.log("unblock failed");
        res.redirect("/admin/pageerror")      
    }
}



const sample = async (req,res)=>{
    try {
        res.render("sample")
    } catch (error) {
        console.log("error");
        
    }
 }
module.exports={
    customerInfo,sample,
    customerBlocked,customerUnblock
}