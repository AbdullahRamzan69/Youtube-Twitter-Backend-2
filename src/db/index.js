// this file is for connection DB 


import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      console.log(`\n MongoDB connect !! DB HOST : ${connectionInstance.connection.host}`);
      
    } catch (error) {
        console.log('MONGO_DB CONNECTION ERROR ', error);
        process.exit(1)
    }
}   

// an async task returns a promise after completion.
// it is handled in index.js

export default connectDB