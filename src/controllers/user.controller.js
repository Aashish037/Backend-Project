import { asyncHandler } from "../utlis/asyncHandler.js";
import { ApiError } from "../utlis/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utlis/cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { deleteUserImages } from "../utlis/deleteImage.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}



const registerUser = asyncHandler( async (req, res) => {
    // to register user step-by-step
    // check the user details from frontend
    //  validation
    // check if the user is already exist - username, email
    // check for images - avatar is required in models
    // upload them to cloudinary- check avatar 
    // create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, username, password} = req.body;
    // console.log("email: ", email)

        if (
            !fullName?.trim() ||
            !email?.trim() ||
            !username?.trim() ||
            !password?.trim()
            ) {
                throw new ApiError(400, "All fields are required");
                }


    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username is already exist")
    }
    // console.log(req.files)

    const avatarLocalpath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalpath) {
        throw new ApiError(400, "avatar is required!!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "avatar is required!!")
    }


    const user =  await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is registered sucessfully" )
    )

})


const loginUser = asyncHandler(async (req, res) => {
            // 1- get values from client side
            // 2- validation- emptiness checking
            // 3- check user exist and check password
            // 4- assigning of access and refresh token 
            // 5 -send cookies
            // 6- success response

        const {email, username, password} = req.body
        console.log(email);

        // console.log("Login attempt with:");
        // console.log("Email:", email);
        // console.log("Username:", username);
        // console.log("Password Provided:", !!password); // don't log actual password

        if (!(username || email)) {
                throw new ApiError(400, "username or email is required");
        }

        if (!password?.trim()) {
            throw new ApiError(400, "Password is required");
        }


        const user = await User.findOne({
            $or: [
                username ? { username: username.toLowerCase() } : null,
                email ? { email } : null
            ].filter(Boolean)
        }).select("+password"); // <- this is the important part


        //console.log("User found:", user); // Should be null or user data

        if (!user) {
            throw new ApiError(404, " User does not exist ")
        }

        if (!password) {
            // console.log("🚨 Password is missing from request body");
            throw new ApiError(400, "Password is required for login");
        }

        // console.log("🧪 Password passed to bcrypt:", password);

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true  //this helps to make secure and will be modified with server only 
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshtoken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken, 
                },
                "User loggedin Sucessfully"
            )
        )



})


const loggedOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },  
            {
                new: true
            }
        
    
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshtoken =   req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshtoken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const dedcodedToken = jwt.verify(incomingRefreshtoken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(dedcodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh token")
        }

        if(incomingRefreshtoken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {currentPassword, newPassword, confirmPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Current password is incorrect")
    }

    if (!newPassword || newPassword !== confirmPassword) {
        throw new ApiError(400, "New password is required and must match confirm password")
    }

    // Hashing the new password before saving

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse
            (200,{}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                req.user, 
                "Current user fetched successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body

    if (!email?.trim() || !fullName?.trim()) {
        throw new ApiError(400, "Email and full name are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: { email: email, 
                    fullName: fullName 
                }
        },
        { new: true }
    ).select("-password ")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // delete old avatar from cloudinary if exists
        await deleteUserImages(req.user._id, "avatar");

    // upload new avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(500, "Failed to upload avatar to cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

        

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User avatar updated successfully"
            )
        )
})

const updateUserCoverAvatar = asyncHandler(async (req, res) => {

    const coverLocalPath = req.file?.path;

    if(!coverLocalPath){
        throw new ApiError(400, "Cover image is required")
    }

    // delete old cover image from cloudinary if exists
    await deleteUserImages(req.user._id, "coverImage");
    
    // upload new cover image to cloudinary
    const cover = await uploadOnCloudinary(coverLocalPath);

    if(!cover.url){
        throw new ApiError(500, "Failed to upload cover image to cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { cover: cover.url } },
        { new: true }
    ).select("-password");

    

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User cover image updated successfully"
            )
        )
})



export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverAvatar,

}