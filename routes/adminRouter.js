const express = require("express")
const router = express.Router()

const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,"../public/productimages"))
    },
    filename:function(req,file,cb){
        const name = Date.now()+"-"+file.originalname;
        cb(null,name);
    }

})

const upload = multer({ storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
 });

const admincontroller = require("../controllers/admincontroller")
const customercontroller = require("../controllers/customercontroller")
const categorycontroller = require("../controllers/categorycontroller")
const productcontroller = require("../controllers/productcontroller")

const {userauth,adminauth} = require("../middlewares/auth")


router.get("/pageerror",admincontroller.adminerror)
router.post("/logout",admincontroller.adminlogout)

router.get("/users",adminauth,customercontroller.customerInfo)
router.get("/blockcustomer",adminauth,customercontroller.customerBlocked)
router.get("/unblockcustomer",adminauth,customercontroller.customerUnblock)

router.get("/category",adminauth,categorycontroller.categoryInfo)
router.get("/addcategory",adminauth,categorycontroller.loadaddcategory)
router.post("/addcategory",adminauth,categorycontroller.addcategory)
router.get("/editcategory",adminauth,categorycontroller.loadeditcategory)
router.post("/editcategory/:id",adminauth,categorycontroller.editcategory)
router.get("/listcategory",adminauth,categorycontroller.getlistcategory)
router.get("/unlistcategory",adminauth,categorycontroller.getunlistcategory)



router.get("/productlist",adminauth,productcontroller.productlist)
router.get("/addproduct",adminauth,productcontroller.loadaddproducts)
router.post("/addproduct", upload.array('productImage', 3), (req, res, next) => {
    // Error handling
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }
    next();
}, productcontroller.addproducts);

router.get("/productlist/:id",adminauth,productcontroller.softdeleteproduct)




module.exports = router