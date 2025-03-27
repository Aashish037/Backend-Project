import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    videoFile: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 200
    },
    duration: {
        type: Number,
        maxlength: 200
    },
    view: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timeseries: true})



videoSchema.plugin(mongooseAggregatePaginate)

export const  Video = mongoose.model('Video', {videoSchema})