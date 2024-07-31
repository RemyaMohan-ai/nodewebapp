

const pageNotFound = async (req,res)=>{
   try {
    res.render("page 404")
   } catch (error) {
    res.redirect("/pageNotFoundound")
   }
}

const loadhome = async (req,res)=>{
    try {
        return res.render("home")
    } catch (error) {
        res.status(500).send("server error")
        console.log();
    }
}





module.exports={
    loadhome,pageNotFound
}