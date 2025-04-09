import axios from "axios";
import accountModel from "../models/account.model.js";

export const getStatistics = async (req, res) => {
  try {
    const {
      username,
      dateFrom,
      dateTo,
      searchString = "",
      sortBy = 0,
      filterStatus = [],
      pageSize = 0,
      pageNumber = 0,
    } = req.body;

    const { userId } = req;

    if (!username) return res.status(400).send("Username is required");
    if (!dateFrom) return res.status(400).send("From date is required");
    if (!dateTo) return res.status(400).send("To date is required");
    if (!dateFrom) return res.status(400).send("From date is required");

    const user = await accountModel.findOne({ username, userId });
    // res.status(200).json({ User: user });

    const client_id = user.loginUrl.split("/")[3];
    const token = user.token;

    const { data } = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/broadcast/getBroadcastsOverview`,
      {
        username,
        dateFrom,
        dateTo,
        searchString,
        sortBy,
        filterStatus,
        pageSize,
        pageNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data?.ok) {
      return res.status(200).json({ success: true, data: data?.result });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "Failed to get statistics." });
    }
  } catch (error) {
    console.log("Get Statistics Error: ", error);
    res.status(500).json("Internal server error");
  }
};
