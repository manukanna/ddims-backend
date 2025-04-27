const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/userSchema");
const SubmittedSurveys = require("./models/surveyFormSchema");
const SurveyApproval = require("./models/adminApprovalSchema");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { encrypt, decrypt } = require("./utils/encryption");
const { TokenExpiry } = require("./utils/verifyTokenExpiry");
const path = require("path");
const multer = require("multer");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "surveyImages/"); // your upload folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Multer upload instance
const upload = multer({ storage: storage });

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use("/surveyImages", express.static(path.join(__dirname, "surveyImages")));
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/ddims-backend", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

function getuserDetails(user) {
  return {
    email: user.email,
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
  };
}

app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: "successfully register" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["Email already exists"] });
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const decryptedPassword = decrypt(user.encryptedPassword);
    if (decryptedPassword !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const uniqueToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    const loggedInTime = new Date().toISOString();
    res.status(200).json({
      message: "Login successful",
      uniqueToken,
      loggedInTime,
      userDetails: getuserDetails(user),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/me", async (req, res) => {
  const tokenData = TokenExpiry(req, res);
  if (tokenData.statusCode === 401) {
    return res.status(401).json({ message: "Your token has been expired" });
  } else {
    const id = tokenData.userId;
    const user = await User.findById(id);
    return res.status(200).json({
      message: "Your are a valid user",
      userDetails: getuserDetails(user),
    });
  }
});

// Multer fields
const surveyUpload = upload.fields([
  { name: "surveyFormfiles[buildingImageOne]", maxCount: 1 },
  { name: "surveyFormfiles[buildingImageTwo]", maxCount: 1 },
]);

app.post("/submitSurveyForms", surveyUpload, async (req, res) => {
  const tokenData = TokenExpiry(req, res);
  if (tokenData.statusCode === 401) {
    res.status(401).json({ message: "Your token has been expired" });
  } else {
    try {
      const buildSurveyFormfiles = (existingFiles = {}) => {
        return {
          buildingImageOne:
            req.files["surveyFormfiles[buildingImageOne]"]?.[0]?.filename ||
            existingFiles.buildingImageOne ||
            "",
          buildingImageTwo:
            req.files["surveyFormfiles[buildingImageTwo]"]?.[0]?.filename ||
            existingFiles.buildingImageTwo ||
            "",
        };
      };

      const commonFields = {
        surveyFormGeneral: { ...req.body.surveyFormGeneral },
        surveyFormDetails: { ...req.body.surveyFormDetails },
        surveyFormfiles: {}, // We'll add it dynamically below
      };

      const existingSurvey = await SubmittedSurveys.findOne({
        createdBy: tokenData.userId,
        createdEmail: tokenData.email,
      });

      const surveyExisted = await SurveyApproval.findOne({
        submittedUserId: tokenData.userId,
        submittedUserEmail: tokenData.email,
      });

      if (existingSurvey && surveyExisted) {
        // Update
        existingSurvey.set({
          ...commonFields,
          surveyFormfiles: buildSurveyFormfiles(existingSurvey.surveyFormfiles),
        });
        surveyExisted.set({
          submittedSurvey: true
        });

        await surveyExisted.save();
        await existingSurvey.save();
        res.status(200).json({
          message: "You have Updated your Sruvey Details",
          data: existingSurvey,
        });
      } else {
        // Create
        const newSurvey = new SubmittedSurveys({
          ...commonFields,
          surveyFormfiles: buildSurveyFormfiles(),
          createdBy: tokenData.userId,
          createdEmail: tokenData.email,
        });

        const approvedSurvey = new SurveyApproval({
          submittedUserId: tokenData.userId,
          submittedUserEmail: tokenData.email,
          approvalSurveyId: newSurvey._id,
          approvedSurvey: false,
          submittedSurvey: true
        });

        await newSurvey.save();
        await approvedSurvey.save();
        res
          .status(201)
          .json({ message: "You have Submitted your Sruvey Details" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error", error });
    }
  }
});

app.get("/verifySurveyDetails", async (req, res) => {
  const tokenData = TokenExpiry(req, res);
  if (tokenData.statusCode === 401) {
    res.status(401).json({ message: tokenData.error });
  } else {
    try {
      const surveyExisted = await SurveyApproval.findOne({
        submittedUserId: tokenData.userId,
        submittedUserEmail: tokenData.email,
      });
      const surveyDetails = await SubmittedSurveys.findOne({
        createdBy: tokenData.userId,
        createdEmail: tokenData.email,
      });

      if (surveyExisted && surveyDetails) {
        res.status(200).json({
          surveySumitted: surveyExisted.submittedSurvey,
          approvedSurvey: surveyExisted.approvedSurvey,
          message: surveyExisted.submittedSurvey ? "You have already submitted your Survey Details." : "Please submit your Survey",
          surveyDetails : surveyExisted.submittedSurvey ? undefined : surveyDetails,
        });
      } else {
        res.status(200).json({
          surveySumitted: false,
          message: "Please submit your survey",
        });
      }
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
});

// Start server
app.listen(3001, () => {
  console.log("🚀 Server is running on http://localhost:3001");
});
