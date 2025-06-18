import { asyncHandler } from "../utlis/asyncHandler.js";
import { ApiError } from "../utlis/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utlis/cloudinary.js";
import { ApiResponse } from "../utlis/ApiResponse.js";

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

export {registerUser}