const Coupon = require("../models/couponSchema")


const loadAddCoupon = async (req,res)=>{
    try {
      

        res.render('addcoupon');

    } catch (error) {
        console.log("error in loading eror",error);
        res.render("page 404")
    }
}

const addCoupon = async (req,res)=>{
    try {
        const{code,discountType,discountValue,maxDiscountValue,minOrderValue,expiryDate,active} = req.body



        const coupen = new Coupon({
            code,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscountValue,
            expiryDate,
            active

        })

        const newCoupon = await coupen.save()
        res.status(200).redirect('/admin/couponlist');


    } catch (error) {
        console.log("addcoupen error",error);
        res.status(500).render("page 404")
        
    }
}



const couponList = async (req, res) => {
    try {

        const itemsPerPage = 3;
        const currentPage = parseInt(req.query.page) || 1;

        const totalItems = await Coupon.countDocuments(); // Total count from database
        const totalPages = Math.ceil(totalItems / itemsPerPage);



        
        const coupons = await Coupon.find().sort({createdAt:-1}) 
                        .skip((currentPage - 1) * itemsPerPage)
                        .limit(itemsPerPage);

        if (coupons.length === 0) {
            return res.render('couponList', {
                coupons: [],
                message: 'No coupons found',
                currentPage: 1,
                totalPages: 1,
            });
        }

        

        res.render('couponList', {
            coupons: coupons,
            currentPage,
            totalPages,
            // message: coupons.length === 0 ? 'No coupons found' : null,

        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

const loadeditCoupon = async (req,res)=>{
    try {
        const copenId = req.params.couponId;
        const couponDetails =  await Coupon.findById(copenId);
        if (!couponDetails) {
            console.log("nodetils found about coupon");
            
        }
        res.render("editCoupon",{couponDetails

        })
        

    } catch (error) {
        console.log(error);
        res.status(500).render("page 404")
        
    }
}

const editCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;  // Correct variable name
        const { code, discountType, discountValue, minOrderValue, applicableCategories, applicableProducts, expiryDate, active } = req.body;

        if (!couponId) {
            console.log("No couponId provided");
            return res.status(400).render("page 404");
        }

        console.log("couponId:", couponId);

        // Pass couponId directly
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,  // <- Corrected here
            {
                code,
                discountType,
                discountValue,
                minOrderValue,
                applicableCategories,
                applicableProducts,
                expiryDate,
                active
            }, 
            { new: true }  // Return the updated document
        );
console.log("updatedCoupon",updatedCoupon);

        if (!updatedCoupon) {
            console.log("Coupon update failed");
            return res.status(404).render("page 404");
        }

        res.status(200).redirect('/admin/couponlist');

    } catch (error) {
        console.log("editCoupon error", error);
        res.status(500).render("page 404");
    }
};



const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const couponDetails = await Coupon.findByIdAndDelete(couponId);

        if (couponDetails) {
            res.status(200).json({ message: 'Coupon deleted successfully' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        console.log("Error in deleting coupon:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports={
    loadAddCoupon,
    addCoupon,
    couponList,
    loadeditCoupon,
    editCoupon,
    deleteCoupon
}