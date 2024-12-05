const statuCodes ={
    OK : {code:200,message:"successful"},
    CREATED : {code:201 , message: "created"},
    BAD_REQUEST :{code:400,message:"Bad request"},
    NOT_FOUND:{code:404,message:"Not found"},
    INTERNAL_SERVER_ERROR: {code:500,message:"Internal Server error"}

}
module.exports=statuCodes