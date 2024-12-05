
const Category = require('../models/categorySchema');
const Order = require("../models/orderSchema")
const moment = require('moment');


const loadadmin = async (req,res)=>{
    if(!req.session.admin){
        return res.redirect('/login')
    }
    return res.render("admindashboard")
}

 const adminerror = async (req,res)=>{
    try {
    res.render("adminerror")
    console.log("error in admin page");
    
    } catch (error) {
    console.log("issue in rendering error page",error);
    
        res.status(500).send("internal server error")
    }
 }

 const loadDashboard = async (req, res) => {
    try {
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }

        const overallOrderAmount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalAmount: { $sum: "$finalPrice" } } }
        ]);

        const overallDiscount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalDiscount: { $sum: "$totalDiscount" } } }
        ]);

        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const salesCount = await Order.countDocuments(filter);


        const salesReport = await Order.find(filter).select('createdAt finalPrice totalPrice totalDiscount');

        

        const orderStatusCounts = await Order.aggregate([
            { $unwind: "$productDetails" },
        
            { $match: filter },
        
            {
                $group: {
                    _id: "$productDetails.orderStatus", 
                    count: { $sum: 1 },                
                },
            },
        
            { $sort: { count: -1 } }
        ]);
        
        const orderStatusMap = {
            Processing: 0,
            Shipped: 0,
            Delivered: 0,
            Cancelled: 0,
            'Return Request': 0,
            Returned: 0
        };
        orderStatusCounts.forEach(status => {
            orderStatusMap[status._id] = status.count;
        });

        
        const topProducts =  await Order.aggregate([
            { $match: filter },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.productId",
                    totalSold: { $sum: "$productDetails.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$productDetails.quantity", "$productDetails.price"] } } 
    
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    productImage:"$productInfo.productImage[1]",
                    productName: "$productInfo.productName",
                    productPrice: "$productInfo.salePrice",
                    productOffer: "$productInfo.productOffer",
                    totalSold: 1,
                    totalRevenue:1
                }
            }
        ]);

        // Top 5 Best-Selling Categories
        const topCategories = await Order.aggregate([
            { $match: filter },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productDetails.productId',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category', 
                    foreignField: 'name',
                    as: 'categoryInfo'
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: "$categoryInfo.name",
                    totalSold: { $sum: "$productDetails.quantity" },
                    totalRevenue: { 
                        $sum: { 
                            $multiply: ["$productDetails.quantity", "$productDetails.price"]
                        } 
                    }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        


        // Render the dashboard with all the necessary data
        res.render('dashboard', {
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport,
            filterType,
            startDate,
            endDate,
            orderStatusMap,
            topProducts,
            topCategories,
        });
    } catch (error) {
        console.log("Error loading Dashboard", error);
        res.redirect("/admin/pageError");
    }
};




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
    adminerror,adminlogout,loadadmin,loadDashboard
 }