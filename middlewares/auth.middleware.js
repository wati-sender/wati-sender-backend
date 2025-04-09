import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export const protectRequest = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT DECODE:", decoded);
    const user = await userModel.findOne({ _id: decoded._id });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    req.userId = decoded?._id;
    next();
  } catch (error) {
    console.log("Error: ", error);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};
