import mongoose from "mongoose";
// Required to submit template for preview
const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    resource_type: {
      type: String,
      required: false,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("media", mediaSchema);
