import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    qualityRating: {
      type: String,
    },
    wallet: {
      type: Number,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    loginUrl: {
      type: String,
      required: true,
    },
    messageTier: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Accounts", accountSchema);
