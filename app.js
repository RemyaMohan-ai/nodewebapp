
const express = require("express")
const app = express()
const session = require("express-session")
const env = require("dotenv").config();
const db = require("./config/db")
const passport = require("./config/passport")

db()

const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")

const path = require("path")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

app.use(passport.initialize())
app.use(passport.session())

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))


app.use("/",userRouter)
app.use("/admin",adminRouter)

app.listen(process.env.PORT,()=>{
    console.log("server running");
})
