import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true, //Removes leading/trailing spaces
            index:true // if you want to make a field searchable in an optimized way
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, // cloudinary url
            required:true
        },
        coverImage:{
            type:String, // cloudinary url
            required:false
        },
        watchHistory:[
            {
                // If you just saved an ObjectId in watchHistory, MongoDB sees it as just a random string of characters (like "65a3...").
                // It has no idea that this ID belongs to a Video. 
                // It could be an ID for a User, a Comment, or a Tweet. MongoDB doesn't know and doesn't care.
               // By adding ref: "Video", you are giving Mongoose (the library that sits between your Node.js code and MongoDB) a map.
               //  You are telling Mongoose: "Hey, whenever you see an ID inside this watchHistory array,
               //  I promise you it is an ID that belongs to a document in the Video collection.
                type:Schema.Types.ObjectId,
                ref:"Video" 
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String,

        }  
    }
    ,{timestamps:true})

    userSchema.pre('save', async function () {
        if(!this.isModified("password")) return // this is to check if the password has changed if yes it hashes the password if not then the password is not hashed again

        this.password = await bcrypt.hash(this.password , 10)  //this is to hash the password
    })
    // arrow func is not used for callback because it has no access to "this" keyword which we need to have the context fo userSchema
    // bcrypt take two arguments which field to change and how many rounds to take

    userSchema.methods.isPasswordCorrect = async function (password) {
       return bcrypt.compare(password,this.password) // returns true or false after comparing     
    }

    userSchema.methods.generateAccessToken = function(){
       return jwt.sign(
           { _id : this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        )
    }   
    userSchema.methods.generateRefreshToken = function(){
        return jwt.sign(
           { _id : this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        } 
        )
    }

    export const User = mongoose.model("User", userSchema)