const express = require("express")
const router = express.Router()


const usercontroller = require("../controllers/usercontroller")

router.get("/pageNotFound",usercontroller.pageNotFound)
router.get("/",usercontroller.loadhome)







module.exports = router;