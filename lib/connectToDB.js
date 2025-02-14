import mongoose from "mongoose";

export default function connectToDB() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected");
    })
    .catch(() => {
      console.log("Database connection failed");
    });
}
