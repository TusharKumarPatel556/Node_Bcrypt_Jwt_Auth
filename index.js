const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// var cors = require("cors");
// app.use(cors());
// const User = mongoose.model("User", {
//   first_name: String,
//   last_name: String,
//   email: String,
//   avatar: String,
// });

//Get users
// app.get("/users", async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json({
//       status: "SUCCESS",
//       data: users,
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "FAIL",
//       message: err.message,
//     });
//   }
// });

//Is Logged In
//req headers:metadata
const isLoggedIn = (req, res, next) => {
  try {
    const jwtToken = req.headers.token;
    const user = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.json({
      status: "FAILED",
      message: "Please login first",
    });
  }
};

const isUserAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    res.json({
      status: "FAIL",
      message: "You are not allowed to access this page",
    });
  }
};

// app.use(isLoggedIn);
//Sign up
app.post("/signup", async (req, res) => {
  try {
    console.log(req.body);

    const { firstName, lastName, email, password, isAdmin } = req.body;
    const encryptedpassword = await bcrypt.hash(password, 10);

    User.create({
      firstName,
      lastName,
      email,
      password: encryptedpassword,
      isAdmin,
    });
    res.json({
      status: "SUCCESS",
      message: "user signedup successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "FAIL",
      message: err.message,
    });
  }
});

//Sign in
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const passwordMatched = await bcrypt.compare(password, user.password);
    console.log(user);
    if (!passwordMatched) {
      res.status(500).json({
        status: "FAIL",
        message: "Invalid credentials",
      });
    } else {
      const jwtToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
        expiresIn: 120,
      });

      res.json({
        status: "SUCCESS",
        message: `${user.firstName} ${user.lastName} signed in successfully`,
        jwtToken,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "FAIL",
      message: err.message,
    });
  }
});

const User = mongoose.model("User", {
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  isAdmin: Boolean,
});

//logged in users only authentication
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.send(`Welcome user ${req.user.firstName}`);
});

//Logged In  +is Admin
app.get("/admin", isLoggedIn, isUserAdmin, (req, res) => {
  res.send("Admin Page");
});

app.get("/example", isLoggedIn, (req, res) => {
  res.json({ status: "example1", message: "all good " });
});

app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    })
    .catch((err) => console.error(err));
});

// Close MongoDB connection on app termination
// process.on("SIGINT", () => {
//   mongoose.connection.close(() => {
//     console.log("MongoDB connection closed");
//     process.exit(0);
//   });
// });
