import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    allowBroadcast: {
      type: Boolean,
      required: false,
      defaultValue: true,
    },
    groups: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Groups" }],
      required: false,
      defaultValue: [],
    },
    customParams: {
      type: [{ name: String, value: String }],
      required: false,
      defaultValue: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Contacts", contactSchema);
