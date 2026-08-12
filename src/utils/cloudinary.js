//this code file is reusable can be used in future products

import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // by defaul in node

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileUploadCloudinary = async function (localFilePath) {
   try {
     if (!localFilePath) return null
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"    
    })
    //file has been uploaded
    fs.unlinkSync(localFilePath) // remove the locally saved file even if it is successfully uploaded
    return response
    
   } catch (error) {
    if (localFilePath) {
        fs.unlinkSync(localFilePath)
    }
    //remove the locally saved file as the operations gets failed
    return null
   }
}

export {fileUploadCloudinary}