import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { fileUploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//req.body contains the data the frontend sends to your backend, such as { oldPassword, newPassword }.
//req.user contains the logged-in user's information,
// which your verifyJWT middleware put there after verifying their access token.

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken(); // generate ref token
    const accessToken = user.generateAccessToken(); // generate acc token

    user.refreshToken = refreshToken; // assign ref token

    //when using save method of mongoDB the scheme is ran and the schema requires password.username and all that
    //since we are only changing refreshToken we run validationBeforeSave method
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }; // sends those two values back to whatever code called this function.
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating the access/refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  // validate if empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "all fields are required");
  }
  // find if a user exists already by username , email
  // typing $ will show you the MONGODB OPERATORS
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existedUser:", existedUser);

  if (existedUser) {
    throw new apiError(409, "User with this username/email already exists");
  }
  //check for images , check for avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  console.log("avatarLocalPath:", avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  console.log("coverImageLocalPath:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new apiError(400, "avatar is required");
  }
  // upload on cloudinary
  const avatar = await fileUploadCloudinary(avatarLocalPath);
  const coverImage = await fileUploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "avatar is required");
  }
  //create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email,
    username: username.toLowerCase(),
  });

  //remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creation
  if (!createdUser) {
    throw new apiError(500, "something went wrong in registring the user");
  }
  //return res
  return res
    .status(200)
    .json(new apiResponse(200, createdUser, "User registered successfuly "));
});

const loginUser = asyncHandler(async (req, res) => {
  //req.body -> data
  //username or email based
  //find the user by username or email
  //check the password
  //access and refresh token generation
  //send cookie

  // take the data from postman/frontend
  const { email, username, password } = req.body;
  // check if empty
  if (!username && !email) {
    throw new apiError(400, "username or email is required");
  }
  //find the user by email/username
  const user = await User.findOne({
    //User comes from mongoose & findOne is mongoose method
    $or: [{ username }, { email }],
  });
  //if no existing user throw error
  if (!user) {
    throw new apiError(404, "user doesnt exist ");
  }
  // validate the password with a method i created isPasswordCorrect
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(400, "Your given password is incorrect");
  }

  //now we receive access , refresh token by destructuring
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // get the user from mongo db but remove their password , reftoken
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //option controls how the borwser stores cookies
  const options = {
    httpOnly: true, // only access by server not frontend
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        // this response is for frontend
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new apiError(401, "invalid refresh token");

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed "
        )
      );
  } catch (error) {
    throw new apiError(400, "generation of access token failed");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const correctPassword = await user.isPasswordCorrect(oldPassword);

  if (!correctPassword) {
    throw new apiError(
      400,
      "Your given password doesn't match the old password"
    );
  }

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password has been changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  //TODO: delete old image - assignment

  const avatar = await fileUploadCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await fileUploadCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new apiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      //in match field i found one specific user document(the channel owner)
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // in this stage we find that how many other users have subscribed to the user we found in the "match" stage
    {
      $lookup: {
        from: "subscriptions", // The collection you want to join with
        localField: "_id", // The field from the CURRENT collection (users)
        foreignField: "channel", // The field from the OTHER collection (subscriptions)
        as: "subscribers", // What to call the resulting array of matches
      },
      // in this stage we find , how many other users have been subscribed by the user we found in the "match" stage
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new apiError("404", "channel not found");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) //Finds the specific user who is currently logged in.
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // go to User model 
                            localField: "owner", // this refers to the owner field in Video model as we are now in video
                            foreignField: "_id", // this searches any users with ids same as the owner of the video and fethces their data
                            as: "owner",
                            pipeline: [
                                {
                                    $project: { // this pipeline is for filtering the data that the 
                                    // owner gives us . ex : we dont want their password
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

//access token = temporary key and refresh token = key used to get a new temporary key.

// EXPRESS REQUEST (req) — IMPORTANT PROPERTIES & METHODS

// PROPERTIES
/*req.body        // Data sent in request body
req.params      // Parameters from URL
req.query       // Query parameters (?page=2)
req.headers     // All request headers
req.cookies      // Cookies sent by browser
req.user        // Authenticated user (created by our middleware)

req.method      // HTTP method: GET, POST, PUT, DELETE
req.url         // Requested URL
req.originalUrl // Original requested URL
req.path        // URL path
req.protocol    // http / https
req.hostname    // Hostname
req.ip          // Client IP address


// METHODS
req.get()       // Get a specific request header
req.header()    // Same as req.get()
req.is()        // Check request content type
req.accepts()   // Check what response types client accepts */

/*
$match      → filter documents
$group      → group documents / calculate totals
$sort       → sort documents
$project    → select or create fields
$lookup     → join with another collection
$unwind     → turn array elements into separate documents
$limit      → limit number of documents
$skip       → skip documents
$count       → count documents
$addFields  → add/modify fields
*/

/*                                                    $Lookup
from
↓
Which collection should I search?

localField
↓
Which field from my CURRENT collection should I use?

foreignField
↓
Which field from the OTHER collection should I match against?

as
↓
What should I call the matching results?
 */