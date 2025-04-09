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
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TemplatesReports", templatesReportSchema);
