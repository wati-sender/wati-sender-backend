import axios from "axios";

// Controller to login user
export const login = async (req, res) => {
  try {
    const { email, password, client_id } = req.body;
    const response = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/accounts/login`,
      { email, password }
    );

    res.status(200).json({ result: response.data });
  } catch (error) {
    res.status(400).json({ error: error.response.data });
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
    console.log("Login response: ",response.data)
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
