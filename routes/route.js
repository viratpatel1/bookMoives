import express from "express";
import { loginuser } from "../model/login-model.js";
import { Admin } from "../model/AdminPost.js";
import bcrypt from "bcrypt";
import multer from "multer";
import jwt from "jsonwebtoken";
import fs from "fs";
import sendgridTransport from "nodemailer-sendgrid-transport";
import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import shortid from "shortid";
dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.secret,
});

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      // process.env.api_key
      api_key: process.env.key,
    },
  })
);

const storage = multer.diskStorage({
  destination: "photo",
  filename: function (req, file, cb) {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "_" + unique);
  },
});

const upload = multer({
  storage: storage,
});

router.get("/", (req, res) => {
  res.send("Node Serverss");
});

router.get("/u", async (req, res) => {
  await Admin.find()
    .then((re) => res.send(re))
    .catch((err) => res.send(err));
});

// router.get("/u/:id", async (req, res) =>
// {
//     await Admin.find()
//         .then((re) => res.send(re))
//         .catch((err) => res.send(err))
// });

router.get("/admin", async (req, res) => {
  res.send("admin");
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;
    console.log(Email, Password);
    if (!Email || !Password) {
      return res.status(400).json({ message: "All the field are required" });
    }
    const userLogin = await loginuser.findOne({ Email: Email });
    // console.log(userLogin)

    if (userLogin) {
      const isMatch = await bcrypt.compare(Password, userLogin.Password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid Credentials or Password" });
      } else if (isMatch && userLogin.Role == "1") {
        // res.redirect("/sign-up")
        console.log("Admin Had Login The Dashboard");
        const token = jwt.sign({ id: userLogin._id }, process.env.SecretKey, {
          expiresIn: "5 seconds",
        });
        console.log(token);
        res.cookie("jwt-token", token, {
          expires: new Date(Date.now() + 90000),
          httpOnly: true,
        });
        res.json({ ...userLogin.toObject(), token: token });
        return res.status(200).json({ message: "Admin Login Successfully" });
      } else if (isMatch && userLogin.Role == "0") {
        const token = jwt.sign({ id: userLogin._id }, process.env.SecretKey, {
          expiresIn: "5 seconds",
        });

        console.log(userLogin + " " + token);
        res.cookie("jwt-token", token, {
          expires: new Date(Date.now() + 90000),
          httpOnly: true,
        });
        res.json({ ...userLogin.toObject(), token: token });
        return res.status(200).json({ message: "User Login Successfully" });
      }
    } else {
      return res.status(400).json({ message: "Email doesn't exist" });
    }
  } catch (error) {
    // console.log(error.message)
    return res.status(400).json({ message: "Something Went Wrong" });
  }
});

//Register Route
router.post("/sign-up", async (req, res) => {
  const { Name, Email, Password, CPassword } = req.body;
  // console.log(req.body);
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(Password, salt);
    const cpasswordHash = await bcrypt.hash(CPassword, salt);

    if (!Name || !Email || !Password || !CPassword)
      return res.status(404).json({ message: "All Field are Required" });

    const userEmail = await loginuser.findOne({ Email });
    if (userEmail)
      return res.status(400).json({ message: "User Already Exist" });

    if (Password !== CPassword)
      return res.status(400).json({ message: "Password Not Matching" });

    if (!userEmail && Password === CPassword) {
      const user = new loginuser({
        Name,
        Email,
        Password: passwordHash,
        CPassword: cpasswordHash,
      });
      await user.save();
      // console.log(Password, salt, passwordHash)
      console.log("Register Successfully");
      return res.status(200).json({ message: `Register Successfully` });
    } else {
      return res.send(`Password Does not Match`);
      // console.log("Password Does not Match")
    }
  } catch (err) {
    res.status(500);
    return res.send(err.message);
  }
});

router.post("/admin/movies", upload.single("photo"), async (req, res) => {
  try {
    const files = req.file;
    let encodeImg = [];
    // console.log("147 ", files);
    // console.log("148 ", req.body)

    if (!files)
      return res
        .status(400)
        .json({ message: "Please Select the Poster Image" });

    let img = fs.readFileSync(req.file.path);
    encodeImg = img.toString("base64");
    console.log("194 ", req.body.description);
    // const { movie_name, release_date, poster_path, description, No_of_Seat } = req.body;
    let admin = await new Admin({
      filename: files.originalname,
      contentType: files.mimetype,
      poster_path: encodeImg,
      movie_name: req.body.movie_name,
      release_date: req.body.release_date,
      description: req.body.description,
    });

    await admin.save();
    console.log("Register Successfully");
    return res.status(200).json({ message: "Uploaded Successfully" });
  } catch (err) {
    res.send(err.message);
    return res.status(400).json({ message: "Doesn't Upload" });
  }
});

router.post("/book-ticket", async (req, res) => {
  const { str, emails, id, arr } = req.body;
  // console.log(str, emails, id, arr);

  await loginuser
    .findOne({ Email: emails })
    .then((user) => {
      // console.log(user)
      if (!user) {
        return res
          .status(400)
          .json({ message: "User doesn't exist with this email" });
      } else {
        transporter.sendMail({
          to: user.Email,
          from: "resetpass233@gmail.com",
          subject: "Password Reset",
          html: `<h2>${user.Name}, you have Successfully Booked ${id} tickets for <strong>${str}</strong> Movie Show, Your seats are <strong>${arr}</strong>. </h2>
                    <h3>Thank You</h3>`,
          // `<h2>Click on this <a href="https://passwords-reset.herokuapp.com/reset/${token}">link</a> to Reset Password</h2>`
        });
        res.json({ message: "Check your Email" });
      }
    })
    .catch((error) => res.status(400).json({ message: "Try again later" }));
});

router.get(`/admin/updatemovies/:id`, async (req, res) => {
  await Admin.findById(req.params.id)
    .then((exercise) => res.json(exercise))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.delete("/:id", async (req, res) => {
  Admin.findByIdAndDelete(req.params.id)
    .then((admin) => res.json("Admin Deleted"))
    .catch((err) => res.status(400).json("Error:", err));
});

router.put("/admin/updatemovies/:id", async (req, res) => {
  // console.log("246 ",req.body)
  await Admin.findByIdAndUpdate(req.params.id)
    .then((exercise) => {
      // _id: req.params.id;
      exercise.movie_name = req.body.movie_name;
      exercise.release_date = req.body.release_date;
      exercise.description = req.body.description;

      exercise
        .save()
        .then(() => res.json("User updated Correctly!"))
        .catch((err) => res.status(400).json("Error hai: " + err));
    })
    .catch((err) => res.status(404).json("Error: " + err));
});

router.post("/razorpay", async (req, res) => {
  console.log(req.body);
  const { amount } = req.body;
  const payment_capture = 1;
  // const amount = 10000
  const currency = "INR";
  // console.log("a ", amount)
  // console.log("str ", str)
  // console.log("id ", id)
  // console.log("email ", emails)
  try {
    const response = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt: shortid.generate(),
      payment_capture,
    });

    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    console.log(error);
  }
});

export const RouterPage = router;

// router.post("/book-ticket", async (req, res) =>
// {
//     const { text, number, email, id } = req.body;
//     console.log(text, number, email, id);

//     await loginuser.findOne({ Email: email })
//         .then((user) =>
//         {
//             if (!user)
//             {
//                 return res.status(400).json({ message: "User doesn't exist with this email" });
//             }
//             else
//             {
//                 transporter.sendMail({
//                     to: user.Email,
//                     from: "resetpass233@gmail.com",
//                     subject: "Password Reset",
//                     html: `<h2>${user.Name}, you have Successfully Booked ${id} tickets for ${str} <strong></strong> Movie Show. </h2>
//                     <h3>Thank You</h3>`
//                 })
//                 res.json({ message: "Check your Email" })
//             }
//         })
//         .catch((error) => res.status(400).json({ message: "Try again later" }));
// });
