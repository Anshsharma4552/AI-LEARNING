import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,'Please provide a username'],
        unique:true,
        trim:true,
        minlength:[3,'Username must be at least 3 characters long']
    },
    email:{
        type:String,
        required:[true,'Please provide a email'],
        unique:true,
        lowercase:true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:[6,'Password must be at least 6 characters long'],
        select: false
    },
    profileImage:{
        type:String,
        default:null
    },
},{
    timestamps:true
})