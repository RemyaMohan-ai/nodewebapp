const Order = require("../models/orderSchema")
const User = require("../models/userSchema")
const Address = require("../models/addressSchema")
const Product = require("../models/productSchema")
const Wallet = require("../models/walletSchema")


const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const orderlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const orders = await Order.find({ userId })
      .populate({
        path: 'productDetails.productId',
        select: 'productName salePrice price productImage'
      })
      
      .sort({ createdAt: -1 });
      
      const addressDocument = await Address.findOne({ 'address._id': orders.orderingAddress }, { 'address.$': 1 });
            
      const orderingAddress = addressDocument ? addressDocument.address[0] : null;

    res.render("orders", { orders ,orderingAddress});
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


const orderdetails =async  (req, res) => {
  try {

    const orderId = req.params.id;
    // console.log(orderId);

    const order = await Order.findOne({_id:orderId})
    .populate({
      path: 'productDetails.productId',
      select: 'productName salePrice price productImage'
    })
  

  console.log("order",order);
  
const addressDoc = await Address.findOne({ 'address._id': order.orderingAddress },{ 'address.$': 1 });

  
  let orderingAddress = null;
    if (addressDoc && addressDoc.address.length > 0) {
      orderingAddress = addressDoc.address[0]; 
    }
  console.log("orderingAddress",orderingAddress);
  

  return  res.render('userprofile/orderdetails', { order,orderingAddress });
  
} catch (error) {
  console.error(error);
  throw error;
}
}



const cancelProduct = async (req, res) => {
  try {
    const userId  = req.user._id;
    const userWallet = await Wallet.findOne({userId:userId})
    if(!userWallet){
      console.log("userWalletnot found",userWallet);
      
    }else{
      console.log("userWallet",userWallet);
      
    }
    console.log("req.body,",req.body);
    
      const { orderId, productId, cancelReason, cancelQuantity} = req.body; 

      const order = await Order.findOne({_id:orderId});

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      if (order.paymentStatus== "Pending") {
          return res.status(404).json({ message: 'You cant cancel orders in pending payment state' });
      }

      const productInOrder = order.productDetails.find(item => item.productId.toString() === productId);

      
      if (!productInOrder) {
        console.log("Product not found in the order");
        return res.status(404).json({ message: 'Product not found in the order' });
      }
    
      
      const product = await Product.findById(productId);
      const cancelQty = parseInt(cancelQuantity, 10);

      if (productInOrder.orderStatus !== 'Cancelled') {

        if (cancelQty == productInOrder.quantity) {
          productInOrder.orderStatus = 'Cancelled'; 
          productInOrder.cancellationquantity += cancelQty
        } else {
          productInOrder.cancellationquantity = cancelQty
          productInOrder.quantity -= cancelQty; 
          productInOrder.cancellationquantity += parseInt(cancelQty ,10)
           productInOrder.orderStatus = 'Partially Cancelled'; 
        }
      }
      
      productInOrder.cancellationreason = cancelReason;
      

      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      product.stock += cancelQty;

      await product.save();
      
      if (order.paymentStatus === 'Paid') {
        console.log("cancelQuantity * productInOrder.price",cancelQuantity , productInOrder.price);
        
         const refundAmount = parseFloat(cancelQuantity * productInOrder.price)
        console.log("refundAmount",refundAmount);

        userWallet.balance += refundAmount;
        userWallet.transactions.push({
          type: 'credit',
          amount: refundAmount,
          description: `Refund for cancelled product: ${productInOrder.productId}`,
        });
        await userWallet.save();
  
        order.paymentStatus = 'Refunded';
        order.refundAmount += refundAmount
        // order.totalPrice -= refundAmount;
      }
      
      
      
      
      await order.save();

      console.log(`Product cancelled: ${cancelReason}`);

      return res.status(200).json({ message: 'Product cancelled successfully' });

  } catch (error) {
      console.error('Error cancelling the product:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};




const returnProduct = async (req, res) => {
  try {
      const { orderId, productId, returnReason } = req.body;
      console.log("Received return request with", { orderId, productId, returnReason });
    
      const order = await Order.findOne({ _id: orderId });
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      const productInOrder = order.productDetails.find(item => item.productId.toString() === productId);
      if (!productInOrder) {
          return res.status(404).json({ message: 'Product not found in the order' });
      }

      if (productInOrder.orderStatus !== 'Delivered') {
          return res.status(400).json({ message: 'Only delivered products can be returned' });
      }
     
       productInOrder.orderStatus = 'Return Requested';
       productInOrder.returnReason = returnReason;
      
      
      await order.save();

      console.log(`Product return requested: ${returnReason}`);

      return res.status(200).json({ status: true,message: 'Product return requested successfully' });

  } catch (error) {
      console.error('Error requesting the return:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};


const cancelReturn = async (req, res) => {
  try {
      const { orderId, productId } = req.body;
      console.log("Received return request with", { orderId, productId });
    
      const order = await Order.findOne({ _id: orderId });
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      const productInOrder = order.productDetails.find(item => item.productId.toString() === productId);
      if (!productInOrder) {
          return res.status(404).json({ message: 'Product not found in the order' });
      }

      if (productInOrder.orderStatus !== 'Return Requested' && productInOrder.orderStatus !== 'Return Initiated') {
        return res.status(400).json({ message: 'Return can only be canceled if it was requested or initiated.' });
      }

       productInOrder.orderStatus = 'Return cancelled';

      
      await order.save();


      return res.status(200).json({ status: true,message: 'Product return cancelled successfully ' });

  } catch (error) {
      console.error('Error requesting the return:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};




const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('productDetails.productId');
    const addressDoc = await Address.findOne({ 'address._id': order.orderingAddress }, { 'address.$': 1 });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.setHeader('Content-disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    const doc = new PDFDocument({ margin: 50 });

    const invoiceDir = path.join(__dirname, '..', 'invoices');
    const filePath = path.join(invoiceDir, `invoice-${order._id}.pdf`);

    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir);
    }

    doc.pipe(fs.createWriteStream(filePath));
    doc.pipe(res);

    
    doc.fontSize(20)
       .fillColor('#444444')
       .text('LOUNGE LUX', 50, 50, { align: 'right' })
       .fontSize(10)
       .moveDown();

    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(50, 150)
       .lineTo(550, 150)
       .stroke()
       .moveDown();

    doc.fontSize(24)
       .fillColor('#444444')
       .text('INVOICE', 50, 170, { align: 'center' })
       .moveDown();

    doc.fontSize(10)
       .text(`Invoice Number: ${order._id}`, 50, 220)
       .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 235)
       .text(`Payment Method: ${order.paymentMethod}`, 50, 250)
       .moveDown();

    if (addressDoc && addressDoc.address && addressDoc.address.length > 0) {
      const address = addressDoc.address[0];
      
      doc.fontSize(14)
         .fillColor('#444444')
         .text('Bill To:', 50, 300)
         .fontSize(10)
         .text(address.name)
         .text(`${address.building}, ${address.addresslane}`)
         .text(`${address.city}, ${address.pincode}`)
         .text(`Phone: ${address.phone}`)
         .text(`Email: ${address.email}`);
      
      if (address.landMark) {
        doc.text(`Landmark: ${address.landMark}`);
      }
    }

    const tableTop = 400;
    doc.fontSize(10)
       .text('Item', 50, tableTop)
       .text('Quantity', 200, tableTop)
       .text('Unit Price', 300, tableTop)
       .text('Amount', 400, tableTop);

    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(50, tableTop + 20)
       .lineTo(550, tableTop + 20)
       .stroke();

    let position = tableTop + 30;
    let subtotal = 0;

    order.productDetails.forEach((item) => {
      const amount = item.quantity * item.productId.salePrice;
      
      subtotal += amount;

      doc.text(item.productId.productName, 50, position)
         .text(item.quantity.toString(), 200, position)
         .text(`$${item.productId.salePrice.toFixed(2)}`, 300, position)
         .text(`$${amount.toFixed(2)}`, 400, position);

      position += 20;
    });

    doc.strokeColor('#aaaaaa')
       .lineWidth(1)
       .moveTo(50, position + 10)
       .lineTo(550, position + 10)
       .stroke();

    // Add totals
    const totalPosition = position + 30;
    
    doc.fontSize(10)
       .text('Subtotal:', 300, totalPosition)
       .text(`$${subtotal.toFixed(2)}`, 400, totalPosition)
       .text('Coupon Discount:', 300, totalPosition+20)
       .text(`$${order.couponDiscount}`, 400, totalPosition+20)
       .text('Tax:', 300, totalPosition + 40)
       .text(`$${(order.totalPrice - subtotal).toFixed(2)}`, 400, totalPosition + 40)
       .fontSize(12)
       .text('Total:', 300, totalPosition + 60)
       .text(`$${order.totalPrice.toFixed(2)-order.couponDiscount}`, 400, totalPosition + 60);

    // Add footer
    doc.fontSize(10)
       .fillColor('#444444')
       .text('Thank you for your business!', 50, 700, { align: 'center' })
       .text('Payment is due within 15 days. Please include the invoice number on your check.', 50, 715, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};





module.exports={
    orderlist,
    orderdetails,
    cancelProduct,
    returnProduct,
    cancelReturn,
    generateInvoice
}