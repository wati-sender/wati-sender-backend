import axios from "axios";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import dotenv from "dotenv";
import Cryptr from "cryptr";
dotenv.config();
console.log(process.env.CRYPTR_SECRET);
const cryptr = new Cryptr(process.env.CRYPTR_SECRET);

// Controller to login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and Password is required" });
    }

    const user = await userModel.findOne({ username });

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found with given username",
      });

    const userPassword = user.password;
    const decryptedPassword = cryptr.decrypt(userPassword);

    if (decryptedPassword !== password)
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });

    const token = jwt.sign({ _id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    return res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(400).json({ error: "Failed to login" });
  }
};

// Signup controller
// Controller to login user
export const signUp = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username)
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });

    if (!password || password.length < 5)
      return res.status(400).json({
        success: false,
        message: "Password length must be greater than or equal to 5",
      });

    const existingUser = await userModel.findOne({ username });

    if (!existingUser) {
      const hashedPassword = cryptr.encrypt(password);
      const newUser = new userModel({ username, password: hashedPassword });
      await newUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Signup successfully" });
    } else {
      return res.status(400).json({
        success: false,
        message: "User already exist with this username",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Failed to login" });
  }
};

// Verify user
export const verifyUser = async (req, res) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ _id: decoded._id });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "User is authorized",
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Unauthorized!" });
  }
};

// Login to get a token for an account
export const loginAndGetToken = async (email, password, client_id) => {
  try {
    const response = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/accounts/login`,
      { email, password }
    );

    if (response?.data?.profile?.token) {
      return response?.data?.profile?.token;
    }
    console.log("Login response: ", response.data);
    return null;
  } catch (error) {
    console.error(
      `Login failed for ${email}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

// Profile status

// Connected user
/*{
  "ok": true,
  "status": "CONNECTED",
  "qualityRating": "GREEN",
  "phone": "+919461716419",
  "wabaDisconnect": false,
  "isEmptyEnv": false
}*/

// Banned user
/*{
  "ok": true,
  "status": "BANNED",
  "qualityRating": "  ",
  "phone": "+917207294590",
  "wabaDisconnect": false,
  "isEmptyEnv": false
}*/

export const getAccountStatus = async (token, client_id) => {
  try {
    const response = await axios.get(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/setting/getPhoneRating`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response?.data;
  } catch (error) {
    return null;
    console.log("Account status check error: ", error);
  }
};
