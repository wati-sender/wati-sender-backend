import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    totalContacts: {
      type: Number,
      required: true,
      default: 0,
    },
    successCount: {
      type: Number,
      required: true,
      default: 0,
    },
    failedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    selectedAccounts: {
      type: [mongoose.Schema.ObjectId],
      ref: "Accounts",
      required: true,
      default: [],
    },
    selectedTemplateName: {
      type: String,
      required: true,
    },
    errors: {
      type: [],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
