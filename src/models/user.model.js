import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

userSchema.pre("save", async function(next) {
    if (!this.isModified('password')) return next();
    this.password = bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
    {
        _id: this._id,
        
    },
    process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({ _id: this._id,
        username: this.username,
        email: this.email,
        fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
}

export const  User = mongoose.model('User', {userSchema})