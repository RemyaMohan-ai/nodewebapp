
const express = require("express")
const app = express()

const env = require("dotenv").config();
const db = require("./config/db")
db()


const path = require("path")
app.use(express.json())
app.use(express.urlencoded({extended:true}))




app.listen(process.env.PORT,()=>{
    console.log("server running");
})

