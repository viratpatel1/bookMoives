import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { RouterPage } from "./routes/route.js";

const app = express()
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());
//For Photos
app.use('/', express.static('photo'));

mongoose.connect(process.env.url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to DB"))
    .catch(() => console.log("Not Connected"));

app.use("/", RouterPage);

app.listen(PORT, console.log(`Node Server Started at ${PORT}`));
