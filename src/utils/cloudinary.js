import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
})

const uploadOnCloudinary = async (localFilePath)=>{
try {
    if(!localFilePath) return null
    // Upload the file to Cloudinary
  const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"})
    // file has been uploded successfully
    console.log("File upload successfully on cloudinary", response.url)
    return response;
} catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved tempory file as the upload operation got faield before successfully save the cloudinary.
    console.log("Error while uploading the file to cloudinary",error)
    return null;
    
}
}

export default uploadOnCloudinary;