const  Category = require("../models/categorySchema")
const mongoose = require("mongoose")
const categoryInfo = async (req,res)=>{
    try {
        
    
    page = parseInt(req.query.page)||1
    let limit =4
    let skip = (page-1)*limit

    const categorydata = await Category.find({})
    .sort({name:-1})
    .skip(skip)
    .limit(limit)

    const totalCategories = await Category.countDocuments()
    const totalPages =Math.ceil(totalCategories/limit)
    res.render("categoryList",{
        cat :categorydata,
        totalPages:totalPages,
        totalCategories:totalCategories,
        currentPage:page
    });

} catch (error) {
        console.log("failed in loading catogories",error);
        res.redirect("/pageerror")
        
}
    
}

const loadaddcategory = async (req,res)=>{
    try {
        res.render("addcategory")
    } catch (error) {
        console.log("failed to load add category page");
        res.redirect("/admin/pageerror")
        
    }
}



const addcategory = async (req,res)=>{
    const {name,description}=await req.body
    console.log("name&",name,description);
   
    
    try {
        const existingCategory=await Category.findOne({name:name})
        console.log("xistingCategory",existingCategory );
        
        if(existingCategory){
            console.log("Category alredy exists");
           return res.status(400).json({error:"Category already exists"})  
        }

        let newCategory = new Category({
            name,
            description
        })
        console.log("hdbf",newCategory);
        
        await newCategory.save()
        console.log("new category saved",newCategory);
        
        return res.json({message:"Category aadderd succesfully "})


    } catch (error) {
        console.log("destructuring category and adding deatails failed",error);
        return res.json({error:"Internal server error"})
    }
}

const  loadeditcategory = async (req,res)=>{
   
    try { 
        const id=req.query.id
       const category =await Category.findById(id)
        if(!category){
            res.status(404).send("category not found")
            console.log("category noo found");
            
        }
        res.render("editcategory",{category})
        console.log("Rendering edit category page with:", category); 
    } catch (error) {
        console.log("error in loading editcategory page",error);
        res.redirect("/admin/pageerror")
        
    }
}

const editcategory = async (req, res) => {
    
    try {
        const id = req.params.id;
        const {name,description} = req.body;
        const updatecategory = await Category.findByIdAndUpdate(id,{name:name,description:description},{new:true})
       
        if (!updatecategory) {
            console.log("Category not found");
            return res.redirect("/admin/category");
        }
        console.log("edited category",updatecategory);
        
        console.log("Category updated successfully");
        res.redirect("/admin/category"); // Adjust the redirect path as needed
    } catch (error) {
        console.log("Error in updating category", error);
        res.status(500).send("Server error");
    }
};


const getlistcategory = async (req,res)=>{
    try {
        let id= req.query.id
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect("/admin/category")
    } catch (error) {
        console.log("error while listing",error);
        
        res.redirect("/admin/pageerror")
    }
   

}

const getunlistcategory= async (req,res)=>{

    try {
        let id= req.query.id
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")
    } catch (error) {
        console.log("error while listing",error);
        
        res.redirect("/admin/pageerror")
    }
   

}


module.exports={
    categoryInfo,
    addcategory,
    loadaddcategory,
    loadeditcategory,
    editcategory,
    getlistcategory,
    getunlistcategory
}