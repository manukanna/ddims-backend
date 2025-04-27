const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/encryption");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    minlength: [3, "First name must be at least 3 characters"],
    maxlength: [30, "First name must be under 30 characters"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    minlength: [3, "Last name must be at least 3 characters"],
    maxlength: [30, "Last name must be under 30 characters"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Email format is invalid"
    ]
  },
  encryptedPassword: {
    iv: {
      type: String,
      required: [true, "IV is required for encrypted password"]
    },
    content: {
      type: String,
      required: [true, "Encrypted password content is required"]
    }
  },
  userType: {
    type: String,
    enum: {
      values: ["admin", "user", "vendor"],
      message: "User Type must be admin, user, or vendor"
    },
    required: [true, "User Type is required"]
  }
}, {
  strict: true,
  timestamps: true
});

userSchema.virtual("password")
  .set(function (value) {
    this._password = value;
    this.encryptedPassword = encrypt(value);
  })
  .get(function () {
    return this._password;
  });

userSchema.virtual("confirmPassword")
  .set(function (value) {
    this._confirmPassword = value;
  });

userSchema.pre("validate", function (next) {
  if (this._password !== this._confirmPassword) {
    this.invalidate("confirmPassword", "Passwords do not match");
  }
  if (!this._password) {
    this.invalidate("password", "Password is required");
  } else if (this._password.length < 8) {
    this.invalidate("password", "Password must be at least 8 characters");
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
