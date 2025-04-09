import mongoose from "mongoose";
// Required to submit template for preview
const watiTemplateIdsSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      ref: "Accounts",
    },
    watiTemplateId: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WatiTemplateIds", watiTemplateIdsSchema);
