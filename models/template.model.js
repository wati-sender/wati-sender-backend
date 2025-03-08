import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "",
    },
    accountsToAdd: { type: [mongoose.Schema.ObjectId], ref: "Accounts" },
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
    submittedForReview: {
      type: Boolean,
      required: true,
      default: false,
    },
    reviewSentSuccess: {
      type: Number,
      required: true,
      default: 0,
    },
    reviewSentFail: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Template", templateSchema);
