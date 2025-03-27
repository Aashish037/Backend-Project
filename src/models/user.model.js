import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,  
        required: true,    
    },
    coverImage: {
        type: String,      
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Video',
            required: true,
        }
    ],
    refreshToken:{
        type: String,
    }
}, {timeseries: true})



export const  User = mongoose.model('User', {userSchema})