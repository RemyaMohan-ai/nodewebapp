const mongoose = require('mongoose');
const Order = require("../models/orderSchema")
const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const fs = require('fs');
const moment = require('moment');


const generateSalesReport = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const pageSize =5;
        const { salesData, totalPages, currentPage, bestSellingProducts, bestSellingCategories, bestSellingBrands } = 
        await generateSalesData(filter, page, pageSize, startDate, endDate);

        
        res.render('report', { 
            salesData,
            bestSellingProducts,
            bestSellingCategories,
            bestSellingBrands , 
            totalPages, 
            currentPage
        });
    } catch (error) {
        console.error("Error generating sales report:", error.message);
        res.status(400).send("Error generating sales report: " + error.message);
    }
};



const generateSalesReportExcel = async (req, res) => {
    try {
        const { filter } = req.query;
        const { salesData } = await generateSalesData(filter); // Only take salesData array here

        if (!Array.isArray(salesData)) {
            throw new Error("Sales data is not an array");
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Total Price', key: 'totalPrice', width: 15 },
            { header: 'Coupon Offer', key: 'couponOffer', width: 20 },
            { header: 'Total Discount', key: 'totalDiscount', width: 15 },
            { header: 'Final Price', key: 'finalPrice', width: 15 },
            { header: 'Delivery Date', key: 'deliveryDate', width: 20 }
        ];

        // Add data rows
        salesData.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId,
                customer: order.customer,
                quantity: order.quantity,
                totalPrice: order.totalPrice,
                couponOffer: order.couponOffer || 'N/A',
                totalDiscount: order.totalDiscount || 0,
                finalPrice: order.finalPrice,
                deliveryDate: new Date(order.deliveryDate).toLocaleDateString()
            });
        });

        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error downloading Excel report:", error.message);
        res.status(400).send("Error downloading Excel report: " + error.message);
    }
};



const generateSalesReportPDF = async (req, res) => {
    try {
        const { filter } = req.query;
        const { salesData } = await generateSalesData(filter);

        const doc = new PDFDocument();
        let filename = `sales_report_${moment().format('YYYYMMDD')}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(10).text('Sales Report', { align: 'center' });
        doc.moveDown();

        const columns = [
            { title: 'Order ID', width: 90 }, 
            { title: 'Customer', width: 90 }, 
            { title: 'Quantity', width: 60 }, 
            { title: 'Total Price', width: 80 }, 
            { title: 'Coupon Offer', width: 80 }, 
            { title: 'Total Discount', width: 80 }, 
            { title: 'Final Price', width: 80 }, 
            { title: 'Delivery Date', width: 80 } 
        ];

        let y = doc.y; 
        let x = 50;

        columns.forEach(column => {
            doc.font('Helvetica-Bold')
               .text(column.title, x, y, { width: column.width, align: 'left' });
            x += column.width; // Move to the next column
        });

        doc.moveTo(50, y + 20) 
           .lineTo(50 + columns.reduce((acc, col) => acc + col.width, 0), y + 20) // Draw line to the end of the table
           .stroke();

        y += 40; 
        salesData.forEach(order => {
            if (y + 100 > 700) {
                doc.addPage();
                y = 50;
            }

            x = 50; 
            const row = [
                order.orderId || 'N/A',
                order.customer,
                order.quantity,
                order.totalPrice,
                order.couponOffer || 'N/A',
                order.totalDiscount || 0,
                order.finalPrice,
                moment(order.deliveryDate).format('MM/DD/YYYY')
            ];

            row.forEach((text, index) => {
                doc.font('Helvetica')
                   .text(text, x, y, { width: columns[index].width, align: 'left' });
                x += columns[index].width; // Move to the next column
            });

            doc.moveTo(50, y + 20) 
               .lineTo(50 + columns.reduce((acc, col) => acc + col.width, 0), y + 20) // Draw line to the end of the table
               .stroke();

            y += 60; 
        });

        doc.end();
    } catch (error) {
        console.error("Error downloading PDF report:", error.message);
        res.status(400).send("Error downloading PDF report: " + error.message);
    }
};

const generateSalesData = async (filter, page = 1, pageSize = 5,start, end) => {
    let startDate, endDate;
    

    if (start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
    } else {
    switch (filter) {
        case 'day':
            startDate = moment().startOf('day').toDate();
            endDate = moment().endOf('day').toDate();
            break;
        case 'week':
            startDate = moment().startOf('week').toDate();
            endDate = moment().endOf('week').toDate();
            break;
        case 'lastWeek':
            startDate = moment().subtract(1, 'week').startOf('week').toDate();
            endDate = moment().subtract(1, 'week').endOf('week').toDate();
            break;
        case 'month':
            startDate = moment().startOf('month').toDate();
            endDate = moment().endOf('month').toDate();
            break;
        case 'year':
            startDate = moment().startOf('year').toDate();
            endDate = moment().endOf('year').toDate();
            break;
        default:
            // If no filter is specified, return all data
            startDate = null;
            endDate = null;
    }
}

    const matchStage = {
        "productDetails.orderStatus": "Delivered",
    };

    if (startDate && endDate) {
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    const totalSalesCount = await Order.aggregate([
        { $match: matchStage }
    ]);

    const totalSalesData = totalSalesCount.length;
    console.log("totalSalesCount,totalSalesData",totalSalesData ,totalSalesCount);

    const salesData = await Order.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: 'products',
                localField: 'productDetails.productId',
                foreignField: '_id',
                as: 'products'
            }
        },
        { $unwind: "$products" },
        {
            $lookup: {
                from: 'coupons',
                localField: 'couponCode',
                foreignField: 'code',
                as: 'coupon'
            }
        },
        { $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                orderId: "$orderNumber",
                customer: "$user.name",
                quantity: "$productDetails.quantity",
                totalPrice: "$totalPrice",
                productOffer: "$productDiscount",
                couponOffer: "$couponDiscount",

                totalDiscount: { $sum: ["$productDiscount", "$couponDiscount"] } || 0,
                finalPrice: "$finalPrice",
                deliveryDate: "$createdAt"
            }
        },
        { $sort: { deliveryDate: -1 } } ,
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize }
    ]);
    const totalPages = Math.ceil(totalSalesData / pageSize);
    console.log("totalPages,totalPage",totalPages);

    const bestSellingProducts = await Order.aggregate([
        { $match: matchStage },
        { $unwind: "$productDetails" },
        {
            $group: {
                _id: "$productDetails.productId",
                totalSold: { $sum: "$productDetails.quantity" },
                totalRevenue: { $sum: { $multiply: ["$productDetails.quantity", "$productDetails.price"] } } // Assuming price field exists

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

   
    // const bestSellingCategories = await Order.aggregate([
    //     { $match: matchStage },
    //     { $unwind: "$productDetails" },
    //     {
    //         $lookup: {
    //             from: 'products',
    //             localField: 'productDetails.productId',
    //             foreignField: '_id',
    //             as: 'productInfo'
    //         }
    //     },
    //     { $unwind: "$productInfo" },
    //     {
    //         $group: {
    //             _id: {
    //                 category: "$productInfo.category", 
    //                 categoryId: "$productInfo._id" 
    //             },
    //             totalSold: { $sum: "$productDetails.quantity" }, 
    //             totalRevenue: { 
    //                 $sum: { 
    //                     $multiply: ["$productDetails.quantity", "$productDetails.price"]
    //                 } 
    //             }
    //         }
    //     },
    //     { $sort: { totalSold: -1 } },
    //     { $limit: 10 }
    // ]);
    

 
    const bestSellingCategories = await Order.aggregate([
        { $match: matchStage },
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
                localField: 'productInfo.category', // Matching with category name as a string
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
    


    const bestSellingBrands = await Order.aggregate([
        { $match: matchStage },
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
            $group: {
                _id: "$productInfo.brand",
                totalSold: { $sum: "$productDetails.quantity" }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
    ]);
    
console.log("bestSellingBrands",bestSellingBrands);

    return {
        salesData,
        totalPages,
        currentPage: page,
        bestSellingProducts,
        bestSellingCategories,
        bestSellingBrands

    }

};



module.exports = {
    generateSalesReport,
    generateSalesReportPDF,
    generateSalesReportExcel

};
