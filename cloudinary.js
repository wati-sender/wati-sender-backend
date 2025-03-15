import { v2 } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

console.log("API_KEYS: ", process.env.CLOUDINARY_API_KEY);
v2.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default v2;
