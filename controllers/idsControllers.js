import accountModel from "../models/account.model.js";
import templatesReportsModel from "../models/templatesReports.model.js";
import { escapeRegExpChars } from "../utils/common.js";

export const getAccountIds = async (req, res) => {
  try {
    const {
      account_status = "",
      quality_rating = "",
      search = "",
      tier = "",
      wallet_min,
      wallet_max,
    } = req.query;

    let filter = {};

    // Handle search filter
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: escapeRegExpChars(search),
            $options: "i",
          },
        },
        {
          username: {
            $regex: escapeRegExpChars(search),
            $options: "i",
          },
        },
      ];
    }

    // Handle account status filter
    if (account_status) {
      const statusFilter = account_status.split("_");
      if (statusFilter.length > 0) {
        filter.status = { $in: statusFilter }; // 'status' can be an array like ["CONNECTED", "BANNED"]
      }
    }

    // Handle quality rating filter
    if (quality_rating) {
      const qualityFilter = quality_rating.split("_");
      if (qualityFilter.length > 0) {
        filter.qualityRating = { $in: qualityFilter }; // 'qualityRating' can be an array like ["GREEN", "RED"]
      }
    }

    // Filter based tier
    if (tier) {
      const tiers = tier.split("-");
      if (tiers?.length > 0) {
        filter.messageTier = { $in: tiers };
      }
    }

    // Wallet balance filtering
    if (wallet_min !== undefined && wallet_max !== undefined) {
      // Both wallet_min and wallet_max are provided
      filter.wallet = { $gte: Number(wallet_min), $lte: Number(wallet_max) };
    } else if (wallet_min !== undefined) {
      // Only wallet_min is provided (greater than or equal to)
      filter.wallet = { $gte: Number(wallet_min) };
    } else if (wallet_max !== undefined) {
      // Only wallet_max is provided (less than or equal to)
      filter.wallet = { $lte: Number(wallet_max) };
    }

    // Fetch only the IDs of the accounts
    const accountIds = await accountModel
      .find(filter)
      .sort({ createdAt: -1 })
      .select("+_id"); // Sorting by createdAt if you need it

    console.log("FILTERS: ", filter);
    console.log("FOUND ACCOUNT IDs: ", accountIds);

    // Respond with the matching account IDs
    return res.status(200).json({
      status: true,
      total: accountIds?.length,
      ids: accountIds?.map(({ _id }) => _id),
    });
  } catch (error) {
    console.log("Get Account IDs Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllBulkTemplateCreateReportIDS = async (req, res) => {
  try {
    const { search = "" } = req.query;

    let filter = {};

    // Handle search filter
    if (search) {
      filter.templateName = { $regex: search, $options: "i" }; // Partial match, case-insensitive
    }

    // Fetch only the IDs of the reports
    const reports = await templatesReportsModel
      .find(filter)
      .sort({ createdAt: -1 })
      .select("+_id"); // Sorting by createdAt if needed

    // Respond with the matching report IDs
    return res.status(200).json({
      success: true,
      total: reports.length, // Return the total number of matched reports
      ids: reports.map(({ _id }) => _id), // Extract only the _id values from the results
    });
  } catch (error) {
    console.log("Templates reports get error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get template import reports",
      error: error.message,
    });
  }
};
