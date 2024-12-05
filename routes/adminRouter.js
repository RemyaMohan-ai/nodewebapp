const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "../public/productimages"));
    },
    filename: function(req, file, cb) {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage }).array('productImage', 5); 

const admincontroller = require("../controllers/admincontroller")
const customercontroller = require("../controllers/customercontroller")
const categorycontroller = require("../controllers/categorycontroller")
const productcontroller = require("../controllers/productcontroller")
const ordercontroller = require("../controllers/adminordercontroller")
const adminCouponController = require("../controllers/adminCouponController")
const salesReportController = require("../controllers/saleReportController")

const {adminauth} = require("../middlewares/auth")





router.get("/",adminauth,salesReportController.generateSalesReport)
router.get("/dashboard",adminauth,admincontroller.loadDashboard)


router.get("/salesreport",adminauth,salesReportController.generateSalesReport)
router.get('/download/report/pdf',adminauth,salesReportController.generateSalesReportPDF)
router.get('/download/report/excel',adminauth,salesReportController.generateSalesReportExcel)

router.get("/pageerror",admincontroller.adminerror)
router.post("/logout",admincontroller.adminlogout)

router.get("/users",adminauth,customercontroller.customerInfo)
router.post("/blockcustomer",adminauth,customercontroller.customerBlocked)
router.post("/unBlockcustomer",adminauth,customercontroller.customerUnblock)

router.get("/category",adminauth,categorycontroller.categoryInfo)
router.get("/addcategory",adminauth,categorycontroller.loadaddcategory)
router.post("/addcategory",adminauth,categorycontroller.addcategory)
router.get("/editcategory",adminauth,categorycontroller.loadeditcategory)
router.post("/editcategory/:id",adminauth,categorycontroller.editcategory)
router.get("/listingcategory",adminauth,categorycontroller.getlistingcategory)
router.post("/addCategoryOffer",adminauth,categorycontroller.addCategoryOffer)
router.post("/removeCategoryOffer",adminauth,categorycontroller.removeCategoryOffer)


router.get("/productlist",adminauth,productcontroller.productlist)
router.get("/addproduct",adminauth,productcontroller.loadaddproducts)


router.post('/addproduct', upload, productcontroller.addproducts);
router.get('/productedit', adminauth, productcontroller.loadEditProduct)
router.post('/deleteimg', adminauth, productcontroller.deleteImg);

router.post('/productedit', adminauth, upload, productcontroller.updateProduct);

router.get("/listingproducts",adminauth,productcontroller.getlistingproduct)

router.post("/addProductOffer",adminauth,productcontroller.addProductOffer)    
router.post("/removeProductOffer",adminauth,productcontroller.removeProductOffer)    


router.get("/orderlist",adminauth,ordercontroller.getAllOrders)
router.post("/updateOrderStatus",adminauth,ordercontroller.updateOrderStatus)
router.get("/orderlist/:orderId",adminauth,ordercontroller.getOrderDetails)



router.get("/addcoupon",adminauth,adminCouponController.loadAddCoupon)    
router.post("/addcoupon",adminauth,adminCouponController.addCoupon)    
router.get("/couponList",adminauth,adminCouponController.couponList)    
router.get("/editCoupon/:couponId",adminauth,adminCouponController.loadeditCoupon)    
router.post("/editCoupon/:couponId",adminauth,adminCouponController.editCoupon)    
router.delete("/deletecoupon/:couponId",adminauth, adminCouponController.deleteCoupon);


module.exports = router