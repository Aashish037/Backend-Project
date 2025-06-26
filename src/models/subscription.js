import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({

    id: {
        type: String,
        required: true
    },
    channel: {
        type: Schema.Types.ObjectId, //whom to subscribe
        ref: "User",
        
    },
    subscriber: {
        type: Schema.Types.ObjectId, //who is subscribing
        ref: "User",
        
    }
}, {timestamps: true})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)