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
            trime:true
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

    userSchema.pre('save', async function (next) {
        if(this.isModified("password")) return next() // this is to check if the password has changed if yes it hashes the password if not then the password is not hashed again

        this.password = await bcrypt.hash(this.password , 10)  //this is to hash the password
        next()
    })
    // arrow func is not used for callback because it has no access to "this" keyword which we need to have the context fo userSchema
    // bcrypt take two arguments which field to change and how many rounds to take

    userSchema.methods.isPasswordCorrect = async function (password) {
       return await bcrypt.compare(password,this.password) // returns true or false after comparing     
    }

    userSchema.methods.generateAccessToken = function(){
       return jwt.sign(
           { _id = this._id,
            email=this.email,
            username=this.username,
            fullName=this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
        )
    }   
    userSchema.methods.generateRefreshToken = function(){
        return jwt.sign(
           { _id = this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
        )
    }

    export const User = mongoose.model("User", userSchema)