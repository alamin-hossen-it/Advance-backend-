import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/user.models.js"
import ApiError from "./apiError.js";

const deleteOldImage = async(userId, type)=>{
try {
    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "User not found")
    }
   const imageType = type === "avatar"? user.avatar : user.coverImage;
   const publicId = imageType.publicId;
     if (!publicId) {
        throw new ApiError(404, "old image not found")
    }
   
    const response = await cloudinary.uploader.destroy(publicId)
     return response;
} catch (error) {
    throw new ApiError(404, error.message || 'error while deleted old photo from cloudinary')
}
}

export default deleteOldImage;