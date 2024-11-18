const Wallet = require('../models/walletSchema'); 

const getWalletDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const wallet = await Wallet.findOne({ userId: userId });


        if (!wallet) {
            return res.status(404).render('error', { message: 'Wallet not found' });
        }
        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        const paginatedTransactions = wallet.transactions
        .slice((page - 1) * limit, page * limit);

    // Render the page with paginated transactions
    res.render('wallet', { 
        wallet: wallet, 
        transactions: paginatedTransactions ,
        currentPage: page,
        totalPages 
    });
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        res.status(500).send("server error")
    }
};




module.exports = {
    getWalletDetails
};
