


const User = require("../models/userSchema")
const Order = require("../models/orderSchema")


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
       let userId = req.body.userId
       const activeOrders = await Order.find({userId:userId,"productDetails.orderStatus":{$in:["Pending", "Return Requested","Shipping","Confirmed"]}})
       console.log("existingOrder in customerBlocked",activeOrders);
    //    if(activeOrders){
    //     return res.status(400).json({success:false,message:"Unablle to Block Usere there are still orders pending"})
    //    }
      const updateduser = await User.updateOne({_id:userId},{$set:{isBlocked:true}})

      if(!updateduser){
        
       return res.status(400).json({ success: false, message: "usernot found" }); // Send error response

      }
      return res.status(200).json({success: true, message: "User blocked successfully" })
    } catch (error) {
        console.log("block failed",error);
        res.status(500).json({ success: false, message: "Failed to block user" }); // Send error response
    }
}

const customerUnblock = async (req,res)=>{
    try {
       let userId = req.body.userId
      const updateduser = await User.updateOne({_id:userId},{$set:{isBlocked:false}})
      console.log("updateduser",updateduser);

      if(!updateduser){
        
       return res.status(400).json({ success: false, message: "usernot found" }); // Send error response

      }
      return res.status(200).json({success: true, message: "User unblocked successfully" })
    } catch (error) {
        console.log("block failed",error);
        res.status(500).json({ success: false, message: "Failed to unblock user" }); // Send error response
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