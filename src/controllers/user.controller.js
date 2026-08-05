import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { fileUploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req,res)=>{
     // get user details from the frontend 
     // validate if empty
     // check if user already exists - username,email
     // check for images , check for avatar
     // upload them to cloadinary
     // create user object - create entry in db
     // remove password and refresh token from response
     // check for user creation
     // return response

    //get user details from the frontend 
    const {fullName,email,username,password} = req.body
    console.log("email: ", email);

    // validate if empty
    if (
        [fullName,email,username,password].some((field)=>
        field?.trim() === "")
    ) {
        throw new apiError(400,"all fields are required")
    }
    // find if a user exists already by username , email
   const existedUser = User.findOne({
        $or : [{ username }, { email }]
    })
    console.log("existedUser:" ,existedUser);
    
    if(existedUser){
        throw new apiError(409,"User with this username/email already exists")
    }
    //check for images , check for avatar
    const avatarLocalPath= req.files?.avatar[0]?.path
    console.log("avatarLocalPath:", avatarLocalPath);

    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("coverImageLocalPath:" , coverImageLocalPath);
    
    if (!avatarLocalPath) {
        throw new apiError(400,"avatar is required")
    }
    // upload on cloudinary
   const avatar = await fileUploadCloudinary(avatarLocalPath)
   const coverImage = await fileUploadCloudinary(coverImageLocalPathLocalPath)

   if(!avatar){
    throw new apiError(400,"avatar is required")
   }
   //create user object - create entry in db
   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage : coverImage?.url || "",
    password,
    email,
    username : username.toLowerCase()
   })

   //remove password and refresh token from response
   const createdUser = await User.findById(user._id).sekect(
    "-password -refreshToken"
   )

   //check for user creation
   if(!createdUser){
    throw new apiError(500,"something went wrong in registring the user")
   }
   //return res
   return res.status(200).json(
    new apiResponse(200,createdUser,"User registered successfuly ")
   )
})


export {registerUser}