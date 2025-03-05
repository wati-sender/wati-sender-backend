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
    }
  },
  { timestamps: true }
);

export default mongoose.model("TemplatesReports", templatesReportSchema);
