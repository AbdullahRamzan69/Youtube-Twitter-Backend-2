import mongoose, { Schema } from "mongoose";

const subscribtionSchema = new Schema({
    subscriber:{
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    channel:{
         type: mongoose.Types.ObjectId,
        ref: "User"
    }

},{timestamps:true})

export const Subscribtion = mongoose.model("Subscribtion", subscribtionSchema)