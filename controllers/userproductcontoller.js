const product = require("../models/productSchema")
const Wishlist = require("../models/wishlist")
const Cart = require("../models/cartSchema")
const User = require("../models/userSchema")
const Category = require("../models/categorySchema")
const Order = require("../models/orderSchema")




const getSingleProduct =async (req,res)=>{

    const userId = req.session.user;

        let userData = null;
        if (userId) {
            userData = await User.findOne({ _id: userId });
            if (!userData) {
                console.warn("User not found:", userId);
            }
        }
    try {
        const productId =  req.params.id
        const singleProduct = await product.findById(productId).populate('category')
        const relatedProduct = await product.find({ 
            category: singleProduct.category, 
            _id: { $ne: productId } 
        }).limit(4);       
       
        
        
        if (!singleProduct) {
            return res.status(404).send('Product not found');
        }
        res.render("singleproduct",{singleProduct,relatedProduct,user: userData})
    } catch (error) {
        console.log("error",error);
        
    }
}

const getcategories = async (req, res) => {
    const userId = req.session.user;
    let userData = null;
    
    if (userId) {
        userData = await User.findOne({ _id: userId });
        if (!userData) {
            console.warn("User not found:", userId);
        }
    }

    try {
        const page = parseInt(req.query.page) || 1;
        const limit =8; 
        const skip = (page - 1) * limit;

        const categoryName = req.params.name;
        const sortOption = req.query.sort || 'default';
        const searchQuery = req.query.search || '';
        const selectedCategories = req.query.categories ? req.query.categories.split(',') : [];
        const selectedBrands = req.query.brands ? req.query.brands.split(',') : [];
        const selectedColors = req.query.colors ? req.query.colors.split(',') : [];

        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || 100000;

        const wishlist = userId ? await Wishlist.findOne({ user: userId }) : null;

        let query = {};

       


        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        } else if (categoryName && categoryName !== "allproducts") {
            query.category = categoryName;
        }

        if (selectedBrands.length > 0) {
            query.brand = { $in: selectedBrands };
        }

        if (selectedColors.length > 0) {
            query.color = { $in: selectedColors };
        }


        if (minPrice || maxPrice) {
            query.salePrice = { $gte: minPrice, $lte: maxPrice };
        }


        if (searchQuery) {
            query.$or = [
                { productName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
           
           
            ];
            
        }

        let sort = {};

        switch (sortOption) {
            case 'lowToHigh':
                sort = { salePrice: 1 };
                break;
            case 'highToLow':
                sort = { salePrice: -1 };
                break;
            case 'highToLowLetters':
                sort = { productName: -1 };
                break;
            case 'LowToHighLetters':
                sort = { productName: 1 };
                break;
            case 'new':
                sort = { createdAt: -1 };
                break;
            default:
                sort = {createdAt: -1};
        }

        let categoryData = await product.find(query).sort(sort).skip(skip).limit(limit);
        let totalCategories = await product.countDocuments(query);

        if (!categoryData) {
            console.log("Error fetching data from DB");
        }

        const totalPages = Math.ceil(totalCategories / limit);

        const categoryCount = await product.aggregate([
            { $match: query }, 
            { $group: { _id: "$category", count: { $sum: 1 } } }, 
            { $sort: { _id: 1 } } 
        ]);

        const categories = categoryCount.map(item => ({
            name: item._id,
            count: item.count
        }));

        const brandCounts = await product.aggregate([
            { $match: query }, 
            { $group: { _id: "$brand", count: { $sum: 1 } } }, 
            { $sort: { _id: 1 } } 
        ]);

        const brandData = brandCounts.map(item => ({
            brand: item._id,
            count: item.count
        }));
        const colorCounts = await product.aggregate([
            { $match: query }, 
            { $group: { _id: "$color", count: { $sum: 1 } } }, 
            { $sort: { _id: 1 } } 
        ]);

        const colorData = colorCounts.map(item => ({
            color: item._id,
            count: item.count
        }));

        const bestSellingProducts = await Order.aggregate([
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.productId",
                    totalSold: { $sum: "$productDetails.quantity" },
    
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit:3},
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
                    productImage:"$productInfo.productImage",
                    productName: "$productInfo.productName",
                    productPrice: "$productInfo.salePrice",
                    productOffer: "$productInfo.productOffer",
                    productId: "$productInfo._id",
                   
                }
            }
        ]);
        // console.log("bestSellingProducts",bestSellingProducts);
        
        res.render("sectional", {
            
            categoryData,
            totalPages,
            totalCategories,
            currentPage: page,
            categoryName,
            wishlist,
            user: userData,
            currentSort: sortOption,
            searchQuery,
            categories,
            brandData,
            colorData,
            selectedCategories,
            selectedBrands,
            selectedColors,
            bestSellingProducts
        });

    } catch (error) {
        res.status(400).send({ error: "Error occurred" });
        console.log("Error in getcategories", error);
    }
}



searchProduct = async (req, res) => {
    try {
        const query = req.query.query;
        const searchRegex = new RegExp(query, 'i'); // 'i' for case-insensitive search
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        const products = await product.find({
            $or: [
                { productName: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { brand: searchRegex }
            ]
        }).skip(skip).limit(limit);;
        const wishlist = userId ? await Wishlist.findOne({ user: userId }) : null;
        const totalProducts = await product.countDocuments({
            $or: [
                { productName: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { brand: searchRegex }
            ]
        });

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('sectional', { categoryData: products, searchQuery: query ,wishlist ,currentPage: page,totalPages,  categoryName:query
        });
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).send('Server Error');
    }
};



const addwish = async (req, res) => {
    const userId = req.session.user;  
    
    if (!req.session.user) {
        return res.redirect("/login");
    }
    try {
        const productId = req.params.id;
        
                if (!req.session.user) {
                    return res.redirect("/login");
                }
        
                const userId = req.session.user;
                // console.log(userId);
        
      

        let wishlist = await Wishlist.findOne({ user: userId });  // Find the user's wishlist

        if (!wishlist) {
            wishlist =  new Wishlist({ user: userId, products: [] });  // Create a new wishlist if not found
                await wishlist.save();

        }


        const productExists = wishlist.products.includes(productId);
        // console.log(productExists);
        
        if (productExists) {
           await Wishlist.updateOne(
                { user: userId },
                { $pull: { products: productId } }
            );
            return res.status(200).json({ message: "Product removed from wishlist" });
        } else { 
           await Wishlist.updateOne(
                { user: userId },
                {  $addToSet: { products: productId } }
            );
            return res.status(200).json({ message: "Product added to wishlist" });
       }

    
    
    } catch (error) {
        console.log("error in adding to wishlist", error);
        res.status(500).json({ message: "Server error", error });
    }
};




const loadWishlist = async (req, res) => {
   
    const userId = req.session.user;  
    
    if (!userId) {
        return res.redirect("/login");
    }
    try {
        
        
        const userData = await User.findById(userId);
        if (!userData) {
            console.warn("User not found:", userId);
            return res.redirect("/login");
        }

        const wishList = await Wishlist.findOne({ user: userId }).populate('products');

        const wishlistProducts = wishList ? wishList.products : [];
        
        return res.render("wishlist", {
            wishlistProducts,user: userData
        });

    } catch (error) {
        console.log("error", error);
        res.status(500).send("Internal Server Error");
    }
}




module.exports ={
    getSingleProduct,
    getcategories,
    addwish,
    loadWishlist,
   
}