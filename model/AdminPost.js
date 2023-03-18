import mongoose from "mongoose"
const adminpost = new mongoose.Schema({
    contentType: {
        type: String
    },
    filename: {
        type: String
    },
    movie_name: {
        type: String,
        // required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    poster_path: {
        type: String,
    },

    release_date: {
        type: Date,
    },
});

export const Admin = mongoose.model("AdminUser", adminpost);