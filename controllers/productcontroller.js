const Product = require("../models/productSchema")
const category = require("../models/categorySchema")
const mongoose = require("mongoose")

const loadaddproducts = async (req,res)=>{
    console.log("Message received:", req.query.message);
    message = req.query.message
    const categories =await category.find()||[]
    console.log("cat",categories);
    if(!categories){
        console.log("category not found",categories);
        
    }
    
    res.render('addproduct', {
        categories,
        message
        
    });
}

const addproducts = async (req,res)=>{

    try {  
    const {productName,category,brand,color,material,price,salePrice,stock,status,description} = req.body
    const productImages = req.files ? req.files.map(file => file.filename) : [];
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      
      console.log("Product with the same name already exists");
      return res.redirect(`/admin/addproduct?message=Product%20name%20already%20exists`);
    }
    
    const product =  await new Product({
        productName,
      category ,
        brand,
        color,
        material,
        price,
        salePrice,
        stock,
        status,
        description,
        
        productImage:productImages
    })
        console.log(product,"product");
        if(productName==""||category ==""||brand==""||color==""||material==""||price==""||salePrice==""||description==""){
            return res.render("addproduct",{ message: "All fields are required." })
        }
        
       let newProduct = await product.save()
       if(!newProduct){
        
        console.log("products doesnot save to db");
         return res.redirect("/admin/addproduct")
       }
       console.log("product added to db",newProduct);
      
       return res.redirect("/admin/productlist")
    } catch (error) {
        console.log("some issue with add product",error);
        res.send("some error"+error)
        
    }
   
}




const productlist = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1; 
        let limit =5;
        let skip = (page - 1) * limit; 

        const productdata = await Product.find({})
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .sort({createdAt:-1});

        const totalProducts = await Product.countDocuments(); 
        const totalPages = Math.ceil(totalProducts / limit);

        res.render("productList", {
            products: productdata,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};



const loadEditProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId)
        const categories =await category.find()||[]

        if (!product||!categories) {
            return res.status(404).send("Product/category not found");
        }
        res.render("editProduct", { product,categories});
    } catch (error) {
        console.error("Error fetching product", error);
        res.status(500).send("Server error");
    }
};


const updateProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const updatedData = req.body;
        console.log("Product ID and req body:", productId, updatedData);
        
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).send("Product not found");
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            updatedData.productImage = [...existingProduct.productImage, ...newImages];
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });
        
        if (!updatedProduct) {
            return res.status(404).send("Update failed");
        }

        res.redirect("/admin/productlist");
    } catch (error) {
        console.error("Error updating product", error);
        res.status(500).send("Server error");
    }
};

const getlistingproduct = async (req,res)=>{
    try {
        let id= req.query.id
        const productdata = await Product.findById(id)
        
        if(!productdata){
            return res.status(404).send("product not found")
        }

        const newIsDeletedStatus = !productdata.isDeleted;

        if (productdata.isDeleted!== newIsDeletedStatus) {
            await Product.updateOne({ _id: id }, { $set: { isDeleted: newIsDeletedStatus } });
        }

        res.redirect("/admin/productlist");
    } catch (error) {
        console.log("Error while toggling product listing:", error);
        res.status(500).redirect("/admin/pageerror");
    }
};


const addProductOffer = async (req,res)=>{
    try {
        const {productId ,percentage} = req.body        
        const findProduct = await Product.findById(productId)
        if(!findProduct) return res.status(404).json({ status: false,message:"Product not found"})
        const findCategory = await category.findOne({name:findProduct.category})
        if(!findCategory) return res.status(404).json({message:"Category not found"})
            if(findCategory.categoryOffer>percentage){
                return res.status(400).json({status:false,message:"product category has better offer"})

            }
            findProduct.salePrice=  findProduct.salePrice -Math.floor(findProduct.price * percentage / 100)
            findProduct.productOffer=parseInt(percentage)
            await findProduct.save()
            
            res.status(200).json({status:true,message:"product offer added successfully"})

    } catch (error) {
        console.log(error);
        res.status(500).render("page 404")
        
    }
}



const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findById(productId);
        
        if (!findProduct) return res.status(404).json({ message: "Product not found" });

        const productOffer = findProduct.productOffer;

        findProduct.productOffer = 0;

        const findCategory = await category.findOne({ name: findProduct.category });
        if (findCategory) {
            const categoryOffer = findCategory.categoryOffer;

            if (categoryOffer > 0) {
                findProduct.salePrice = findProduct.price - Math.floor(findProduct.price * (categoryOffer / 100));
            } else {
                findProduct.salePrice = findProduct.price-10;
            }
        } else {
            findProduct.salePrice = findProduct.price-10;
        }

        await findProduct.save();
        res.json({ status: true });

    } catch (error) {
        console.log(error);
        res.status(500).render("page 404");
    }
};

module.exports={
    loadaddproducts,
    productlist,
    addproducts,
    getlistingproduct,
    loadEditProduct,
    updateProduct,
    addProductOffer,
    removeProductOffer

}