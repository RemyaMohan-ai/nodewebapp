const express = require("express")
const mongoose = require("mongoose")
const User = require("../models/userSchema")


 const adminerror = async (req,res)=>{
    try {
    res.render("adminerror")
    console.log("error in admin page");
    
    } catch (error) {
    console.log("issue in rendering error page",error);
    
        res.status(500).send("internal server error")
    }
 }

 const adminlogout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("error occure in session destroy");
                return res.redirect("/adminerror")
            }
            res.redirect("/login")
        })
    } catch (error) {
        console.log("unexpected error during logout",error);
        
        res.redirect("/adminerror")
    }
 }






 module.exports={
    adminerror,adminlogout
 }