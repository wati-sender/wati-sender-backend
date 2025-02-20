import mongoose from "mongoose";

const templatesReportSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
    },
    success: {
      type: [String],
      default: [],
    },
    failed: {
      type: [String],
      default: [],
    },
    totalAccounts: {
      type: Number,
    },
    submitForReview: {
      type: [String],
      default: [],
    },
    reviewSubmitFailed: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("TemplatesReports", templatesReportSchema);
