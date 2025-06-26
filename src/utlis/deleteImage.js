import { User } from "../models/user.model";
import { deleteFromCloudinary } from "./cloudinary.utils";

export const deleteUserImages = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    // delete avatar from cloudinary
    if (user.avatar) {
        await deleteFromCloudinary(user.avatar);
    }

    // delete cover image from cloudinary
    if (user.coverImage) {
        await deleteFromCloudinary(user.coverImage);
    }
};
