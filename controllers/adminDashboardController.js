const Order = require("../models/orderSchema")




const loadDashboard = async (req, res) => {
    const { filterType } = req.query;
    let dateFilter = {};
    const today = new Date();

    if (filterType === 'daily') {
        dateFilter = { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)), $lt: new Date(today.setHours(23, 59, 59, 999)) } };
    } else if (filterType === 'weekly') {
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        dateFilter = { createdAt: { $gte: startOfWeek, $lt: endOfWeek } };
    } else if (filterType === 'monthly') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lt: endOfMonth } };
    }

    try {
        const orders = await Order.find(dateFilter);
        const orderData = orders.map(order => ({
            date: order.createdAt,
            totalPrice: order.totalPrice
        }));
        
        res.json(orderData);
    } catch (error) {
        console.error("Error loading orders:", error);
        res.status(500).json({ error: "Unable to load orders" });
    }
};





module.exports={
    loadDashboard
}