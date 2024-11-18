const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const bcrypt = require("bcrypt")
const loadEditUser = async (req,res)=>{
    try {
        const userId = req.session.user
        const user =  await User.findOne({_id:userId})
        if(!user){
            console.log("user not found");
            return res.redirect("/login")
        }        
        req.session.passwordChanged = null

        return res.render("userprofile/edituser",{user})



    } catch (error) {
        console.log(error);
        
    }
}
const editUser = async (req,res)=>{
    try {
        const userId = req.session.user

        updatedData=req.body
        updatedUser =await User.findByIdAndUpdate(userId, updatedData, { new: true })
        if (!updatedUser) {
            console.log("Update failed");
            
            return res.status(404).send("Update failed");
        }
        return res.redirect("/userprofile")

    } catch (error) {
        console.log(error);
        
    }
}
const getchangePassword =async (req,res)=>{
    try {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if(req.session.passwordChanged){
        return res.redirect("/userprofile")
    }
    res.render("userprofile/changepassword")
    } catch (error) {
        console.log(error);
        
    }
    
}

const changePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body;
        const userId = req.session.user;

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });
        req.session.passwordChanged = true;

        res.status(200).json({ message: 'Password updated successfully' });
        
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





const addressBook = async (req,res)=>{
    try {
        const userId= req.user._id;

        const addresses = await Address.findOne({userId})
        let addresslist = addresses?addresses.address:null
        res.render("userprofile/useraddress",{
            address:addresslist
        })
    } catch (error) {
        console.log(error);
        
    }
}

const addNewAddress = async (req, res) => {
    try {
        const { name, altPhone, phone, email, building, addresslane, city, state, pincode, landMark } = req.body;

        const updatedUser = await Address.findOneAndUpdate(
            { userId: req.user._id },
            {
                $addToSet: {
                    address: {
                        name,
                        phone,
                        altPhone,
                        email,
                        building,
                        addresslane,
                        city,
                        state,
                        landMark,
                        pincode
                    }
                }
            },
            { new: true, upsert: true }
        );

        const newAddress = updatedUser.address[updatedUser.address.length - 1];
        req.session.selectedAddress = newAddress._id;
        res.status(200).json({ message: 'Address added successfully', newAddress });

        // res.redirect('/cart/checkout');
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error: error.message });
    }
};






const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        if (!addressId) {
            return res.status(400).json({ error: 'Address ID is required' });
        }

        const address = await Address.findOne(
            { "address": { $elemMatch: { _id: addressId } } },
            { "address.$": 1 }
        );

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.render("userprofile/editaddress", {
            address: address.address[0]
        });

    } catch (error) {
        console.error('Error in loadEditAddress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updatedAddress = async (req,res)=>{
    try {
        const addressId = req.params.id;
        const updatedData = req.body
        const editedAddress = await Address.updateOne(
            {"address._id":addressId},
            {$set:{"address.$":updatedData}}
        )
        if(editedAddress) {
            res.status(200).json({ message: 'Address updated successfully' });
        }
    } catch (error) {
        console.error('Error in editAddress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const deleteAddress = async (req,res)=>{
    try {
        const userId = req.user._id; 

        const addressId = req.params.id;
        const deleteAddress = await Address.updateOne(
            { userId: userId },
            { $pull: { address: { _id: addressId } } }

        )
        if(deleteAddress){
            res.status(200).json({ message: 'Address deleted successfully' });

        }
    } catch (error) {
        console.log("error in deleting address",error);
        res.status(500).json({ error: 'Internal server error' });

    }
}


const loadReferral  = async (req,res)=>{
    try {
        const userId = req.user._id;
        const user  = await User.findById(userId)
        const referralCode =  user.referralCode

        res.render("userprofile/referal",{
            referralCode: referralCode
        })
    } catch (error) {
        console.error('Error in referel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


const applyReferral  = async (req,res)=>{
    try {
        const {referralCode}  = req.body;
        if(!referralCode){
            return res.status(400).json({ 
                status: false, 
                message: 'no refera;' 
            });
        }
        console.log("referralCode",referralCode);
        const userId = req.user._id;
        const user = await User.findById(userId)
        console.log("referaluser",user);
        console.log("req.body",req.body);
        if (user.redeemed) {
            return res.status(400).json({ 
                status: false, 
                message: 'You have already used a referral code' 
            });
        }
        if (user.referralCode === referralCode) {
            return res.status(400).json({ 
                status: false, 
                message: 'You cannot use your own referral code' 
            });
        }
     
        const findReferral =  await User.findOne({referralCode: referralCode})
        if(!findReferral){
            return res.status(404).json({ 
                status: false, 
                message: 'Invalid referral code' 
            });       
         }
        findReferral.wallet=100
        await findReferral.save()
        user.wallet=100
        user.redeemed=true
        await user.save()
        return  res.status(200).json({status:true,message:'Referral code applied' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false,error: 'Internal server error' });
        
    }
}



module.exports={
    loadEditUser,
    editUser,
    addressBook,
    addNewAddress,
    loadEditAddress,
    updatedAddress,
    deleteAddress,
    changePassword,
    getchangePassword,
    loadReferral,
    applyReferral
}