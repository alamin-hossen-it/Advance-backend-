import ApiError from "../utils/apiError.js";
import {asyncHandler}from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";


export const registerUser  = asyncHandler(async (req, res, next)=>{
// get user details from frontend.
 const {fullName, email, userName, password} = req.body;
 // validate user credintials.
 if([fullName, email, userName, password].some((field)=>field?.trim()==="")){
  throw new ApiError(400, "All fields are required")
 };
// if user already exists: by username and email.
 const existedUser = await User.findOne({$or: [{userName}, {email}]})
 if(existedUser){
  throw new ApiError(409, "User already exist with this email or username ")
 };

 // check for iamges and avatar.
 const avatarImageLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;
if(!avatarImageLocalPath){
  throw new ApiError(400, "Avatar image is required")
}

// upload images and avater to cloudinary. 
const avatar = await uploadOnCloudinary(avatarImageLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)
// check images successfully saved in cloudinary.
if(!avatar){
    throw new ApiError(400, "Avatar image is required")
}

// finaly create user object and save into database.
const newUser = await User.create({fullName, avatar: avatar.url, coverImage: coverImage?.url || "", email, password, userName: userName.toLowerCase()})
// remove password and refresh token field from response.
const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
// check user is created successfully or not.
if(!createdUser){
  throw new ApiError(500, "Something went wrong while register user in database")
}
// if user created then send the return response.
return res.status(201).json(
 new ApiResponse(201, createdUser, "User is created successfully")
)










 

})

