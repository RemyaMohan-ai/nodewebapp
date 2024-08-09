const Product = require("../models/productSchema")

const loadaddproducts = async (req,res)=>{
    return res.render("addproduct")
}

const addproducts = async (req,res)=>{

    try {  
    const {productName,category,brand,color,material,price,salePrice,stock,status,description} = req.body
    const productImages = req.files ? req.files.map(file => file.filename) : [];

    const product =  await new Product({
        productName,
        category,
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
        const existingProduct = await Product.findOne({ productName });
        if (existingProduct) {
          
          console.log("Product with the same name already exists");
          return res.redirect("/admin/addproduct");
        }
       const newProduct = await product.save()
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




const productlist = async (req,res)=>{
    page = parseInt(req.query.page)||1
    let limit =10
    let skip = (page-1)*limit

    const productdata = await Product.find({})
    .sort({name:-1})
    .skip(skip)
    .limit(limit)
    const totalProducts = await Product.countDocuments()
    const totalPages =Math.ceil(totalProducts/limit)
    res.render("productlist",{
        products :productdata,
        totalPages:totalPages,
        totalCategories:totalProducts,
        currentPage:page
    });
    

}


const softdeleteproduct = async (req,res)=>{
    try {
        let id= req.query.id
        await Product.updateOne({_id:id},{$set:{isDeleted:tue}})
        res.redirect("/admin/productlist")
    } catch (error) {
        console.log("error while listing",error);
        
        res.redirect("/admin/pageerror")
    }
   

}


module.exports={
    loadaddproducts,
    productlist,
    addproducts,softdeleteproduct

}