import mongoose from "mongoose";

const accountsReportSchema = new mongoose.Schema(
  {
    inserted: {
      type: [String],
      default: [],
    },
    exist: {
      type: [String],
      default: [],
    },
    failed: {
      type: [String],
      default: [],
    },
    total: {
        type: Number,
    }
  },
  { timestamps: true }
);

export default mongoose.model("AccountsReports", accountsReportSchema);
