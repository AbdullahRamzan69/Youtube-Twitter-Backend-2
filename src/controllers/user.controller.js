import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { fileUploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

//req.body contains the data the frontend sends to your backend, such as { oldPassword, newPassword }.
//req.user contains the logged-in user's information,
// which your verifyJWT middleware put there after verifying their access token.

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findOne(userId)
        const refreshToken = user.generateRefreshToken() // generate ref token
        const accessToken = user.generateAccessToken() // generate acc token

        user.refreshToken = refreshToken // assign ref token

        //when using save method of mongoDB the scheme is ran and the schema requires password.username and all that
        //since we are only changing refreshToken we run validationBeforeSave method
        await user.save({validateBeforeSave : false})  
        
        return {accessToken,refreshToken} // sends those two values back to whatever code called this function.
    } catch (error) {
        throw new apiError(500,"Something went wrong while generating the access/refresh token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
     console.log("registerUser reached");

    console.log(req.files);
    console.log(req.body);

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
    // typing $ will show you the MONGODB OPERATORS
   const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    console.log("existedUser:" ,existedUser);
    
    if(existedUser){
        throw new apiError(409,"User with this username/email already exists")
    }
    //check for images , check for avatar
    const avatarLocalPath= req.files?.avatar?.[0]?.path 
    console.log("avatarLocalPath:", avatarLocalPath);

    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    console.log("coverImageLocalPath:" , coverImageLocalPath);
    
    if (!avatarLocalPath) {
        throw new apiError(400,"avatar is required")
    }
    // upload on cloudinary
   const avatar = await fileUploadCloudinary(avatarLocalPath)
   const coverImage = await fileUploadCloudinary(coverImageLocalPath)

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
   const createdUser = await User.findById(user._id).select(
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

const loginUser = asyncHandler(async (req,res)=>{
    //req.body -> data
    //username or email based 
    //find the user by username or email
    //check the password
    //access and refresh token generation
    //send cookie

    // take the data from postman/frontend
    const {email,username,password} = req.body
    // check if empty
    if(!username && !email) {
        throw new apiError(400,"username or email is required")
    }
    //find the user by email/username
    const user = await User.findOne({ //User comes from mongoose & findOne is mongoose method
        $or:[{username},{email}]
    })
    //if no existing user throw error
    if(!user){
        throw new apiError(404,"user doesnt exist ")
    }
    // validate the password with a method i created isPasswordCorrect
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(400,"Your given password is incorrect")
    }

 
    //now we receive access , refresh token by destructuring
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    // get the user from mongo db but remove their password , reftoken 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
     
    //option controls how the borwser stores cookies
    const options = {
        httpOnly: true, // only access by server not frontend
        secure: true 
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse( // this response is for frontend
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new apiError(401, "unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user) throw new apiError(401,"invalid refresh token")
 
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new apiError(401,"refresh token is expired or used")
     }
  
     const options = {
         httpOnly : true,
         secure : true
     }
 
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken",newRefreshToken , options)
    .json(
     new apiResponse(
         200,
         {accessToken,refreshToken : newRefreshToken},
         "access token refreshed "
 
     )
    )
   } catch (error) {
    throw new apiError(400 , "generation of access token failed")
   }

   const changePassword = asyncHandler(async(req,res)=>{
    
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?.id)

    const correctPassword = await user.isPasswordCorrect(oldPassword)

    if(!correctPassword){
        throw new apiError(400,"Your given password doesnt match with old password")
    }
    user.password = newPassword
    user.save({validateBeforeSave: false})
   })
   return res
   .status(200)
   .json( new apiResponse(200,
    {},
    "password has been changed"
   ))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
}

//access token = temporary key and refresh token = key used to get a new temporary key.