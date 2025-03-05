import mongoose from "mongoose";
// Required to submit template for preview
const watiTemplateIdsSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
    },
    watiTemplateId: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WatiTemplateIds", watiTemplateIdsSchema);
