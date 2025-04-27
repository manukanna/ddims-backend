const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      require: true,
    },
    createdEmail: {
      type: String,
      require: true,
    },
    surveyFormGeneral: {
      rNumber: {
        type: String,
        required: [true, "R-Number is required"],
        trim: true,
      },
      siteAddress: {
        type: String,
        required: [true, "Site Address is required"],
        trim: true,
      },
      postcode: {
        type: String,
        required: [true, "Postcode is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      region: {
        type: String,
        required: [true, "Region is required"],
        trim: true,
      },
    },
    surveyFormDetails: {
      poppnsn: {
        type: String,
        required: [true, "POP-PN-SN is required"],
        trim: true,
      },
      dipd: {
        type: String,
        required: [true, "DPID is required"],
        trim: true,
      },
      pianoi: {
        type: String,
        required: [true, "PIANOI# is required"],
        trim: true,
      },
      preSurveyPlanner: {
        type: String,
        required: [true, "Pre-Survey-Planner is required"],
        trim: true,
      },
      region: {
        type: String,
        required: [true, "Region is required"],
        trim: true,
      },
      planner: {
        type: String,
        required: [true, "Planner is required"],
        trim: true,
      },
    },
    surveyFormfiles: {
      buildingImageOne: {
        type: mongoose.Schema.Types.Mixed, // Use this for complex data like files, buffers, etc.
        required: [true, "Building Image One is required"],
      },
      buildingImageTwo: {
        type: String,
        required: [false, "Building Image Two is optional"],
        trim: true,
      },
    },
  },
  { timestamps: true,
    collection: 'SubmittedSurveys' 
  }
); // Add timestamps (createdAt, updatedAt)

module.exports = mongoose.model("Surveys", surveySchema);
