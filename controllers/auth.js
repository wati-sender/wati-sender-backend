import axios from "axios";
import jwt from "jsonwebtoken";

// Controller to login user
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username === process.env.APP_USERNAME &&
      password === process.env.APP_PASSWORD
    ) {
      // Generating token to storing in cooke for next time
      const token = jwt.sign(
        { user_name: "largemedia" },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
      );
      return res.status(200).json({ success: true, token });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Credentials!☹️" });
    }
  } catch (error) {
    res.status(400).json({ error: "Failed to login" });
  }
};

// Verify user
export const verifyUser = async (req, res) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    const result = jwt.verify(token, process.env.JWT_SECRET);

    if (result.user_name === process.env.APP_USERNAME) {
      return res.status(200).json({
        success: true,
        message: "User is authorized",
      });
    }
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
