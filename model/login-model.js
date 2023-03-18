import mongoose from "mongoose"
const loginform = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
    },
    Password: {
        type: String,
        required: true,
    },
    CPassword: {
        type: String,
        required: true,
    },
    Role: {
        type: Number,
        default: 0,
    },
    // Tokens: {
    //     type: String,
    //     required: true,
    // }
});

export const loginuser = mongoose.model("UserData", loginform);
