const mongoose = require("mongoose");

const SurveyApproval = new mongoose.Schema(
  {
    submittedUserId: {
      type: String,
      require: true,
    },
    submittedUserEmail: {
      type: String,
      require: true,
    },
    submittedSurvey:{
      type: Boolean,
      require: true
    },
    approvalSurveyId: {
        type: String,
        require: true,
    },
    approvedSurvey: {
        type: Boolean,
        require: true
    },
    approvedAdminEmail:{
        type: String,
        require: false,
    },
    approvedAdminId:{
        type: String,
        require: false,
    },
  },
  { timestamps: true,
    collection: 'SurveyApprovalStatus' 
  }
);

module.exports = mongoose.model("SurveyApprovalStatus", SurveyApproval);
