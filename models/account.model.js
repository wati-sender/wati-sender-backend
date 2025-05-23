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
    currency: {
      type: String,
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
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Accounts", accountSchema);
