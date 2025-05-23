import PQueue from "p-queue";
import accountModel from "../models/account.model.js";
import { asyncForEach, escapeRegExpChars } from "../utils/common.js";
import { getAccountStatus, loginAndGetToken } from "./auth.js";
import accountsReportModel from "../models/accountsReport.model.js";
import axios from "axios";

export const addBulkAccounts = async (req, res) => {
  try {
    const { userId } = req;

    const { accounts } = req.body;
    const insertedUsernames = [];
    const failedUserNames = [];
    const existUserNames = [];
    if (!accounts || accounts.length === 0) {
      return res.status(400).json({ message: "Accounts are required" });
    }

    await asyncForEach(accounts, async (data, index) => {
      const { name, phone, username, password, loginUrl } = data;

      const client_id = loginUrl.split("/")[3];

      // if (!phone || !username || !password || !loginUrl) {
      //   return res.status(400).json({
      //     message: "Phone, username, password, loginUrl are required",
      //   });
      // }

      const existingAccount = await accountModel.findOne({
        username,
        loginUrl,
        userId,
      }); //   If not exist add new contact
      console.log("Existing Account: ", existingAccount);
      try {
        if (!existingAccount) {
          const token = await loginAndGetToken(username, password, client_id);
          console.log("Token: ", token);

          if (token) {
            const newAccount = new accountModel({
              name,
              phone,
              username,
              password,
              loginUrl,
              token: token || null,
              userId,
            });

            await newAccount.save();
            if (!newAccount) {
              failedUserNames.push(username);
            } else {
              insertedUsernames.push(username);
            }
          } else {
            failedUserNames.push(username);
          }
        } else {
          existUserNames.push(username);
        }
      } catch (err) {
        console.log("Error while adding account: ", err);
        failedUserNames.push(username);
      }
    });

    const accountReport = new accountsReportModel({
      total: accounts?.length,
      inserted: insertedUsernames,
      exist: existUserNames,
      failed: failedUserNames,
      userId,
    });

    // Save account report
    await accountReport.save();

    return res.status(200).json({
      status: true,
      message:
        existUserNames?.length === accounts?.length
          ? "All accounts are already exists"
          : "Bulk accounts added successfully",
      insertedUsernames,
      failedUserNames,
      existUserNames,
    });
  } catch (error) {
    console.log("Add Bulk Accounts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAccounts = async (req, res) => {
  try {
    const {
      account_status = "",
      quality_rating = "",
      limit = 10,
      page = 0,
      search = "",
      tier = "",
      wallet_min,
      wallet_max,
    } = req.query;

    const { userId } = req;

    let filter = { userId };

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

    const allAccounts = await accountModel
      .find(filter)
      .limit(limit)
      .skip(limit * page)
      .sort({ createdAt: -1 })
      .select("-token");

    console.log("FILTERS: ", filter);
    console.log(
      "FOUND ACCOUNTS: ",
      allAccounts?.map((acc) => acc?.username)
    );

    let totalCount;

    if (
      search ||
      account_status ||
      quality_rating ||
      tier ||
      wallet_min ||
      wallet_max
    ) {
      totalCount = await accountModel.countDocuments(filter);
    } else {
      totalCount = await accountModel.countDocuments({ userId });
    }
    return res.status(200).json({
      total: totalCount,
      accounts: allAccounts,
    });
  } catch (error) {
    console.log("Get All Accounts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSingleAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide userId" });
    }

    // Permanently delete the account
    const deletedAccount = await accountModel.findByIdAndDelete(userId);

    if (!deletedAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Single account delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

export const deleteMultipleAccounts = async (req, res) => {
  try {
    const { userIds } = req.body; // Expecting an array of userIds

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid userIds array",
      });
    }

    // Permanently delete all accounts with matching userIds
    const result = await accountModel.deleteMany({ _id: { $in: userIds } });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No accounts found to delete" });
    }

    res.status(200).json({
      success: true,
      message: "Accounts deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Multiple account delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete accounts",
      error: error.message,
    });
  }
};

export const refetchAccountStatus = async (req, res) => {
  try {
    const accounts = await accountModel.find();
    console.log("TASK STARTED");

    const queue = new PQueue({
      concurrency: Math.floor(accounts?.length),
    }); // Send all request at once

    const temp = [];
    await Promise.all(
      accounts?.map((account) => {
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];

            // Send batch API request
            const response = await axios.get(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/setting/wabaAccountStates`,
              { headers: { Authorization: `Bearer ${account?.token}` } }
            );
            temp?.push({
              data: response.data?.wabaStates,
            });
            console.log("TEMP: ", response?.data);
            if (response?.data?.ok) {
              await accountModel.findOneAndUpdate(
                { _id: account?._id },
                {
                  status: response?.data?.wabaStates?.status,
                  qualityRating: response?.data?.wabaStates?.qualityRating,
                  messageTier: response?.data?.wabaStates?.messagingLimitTier,
                }
              );
            }
          } catch (error) {
            console.log("first", error);
          }
        });
      })
    );

    await queue.onIdle();

    console.log("REFETCHING_COMPLETED");
  } catch (error) {
    console.log("ACCOUNT_STATUS_FETCHING_ERROR: ", error);
  }
};

export const refetchAccountWallet = async (req, res) => {
  try {
    const accounts = await accountModel.find();
    console.log("TASK STARTED");

    const queue = new PQueue({
      concurrency: Math.floor(accounts?.length),
    }); // Send all request at once

    await Promise.all(
      accounts?.map((account) => {
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];

            // Send batch API request
            const { data } = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/payment/getCredit`,
              { domain: account?.loginUrl?.replace("/login", "") },
              { headers: { Authorization: `Bearer ${account?.token}` } }
            );

            console.log(
              "WALLET_DATA: ",
              `${account?.username} : ${data?.creditCustomer?.credit}`
            );
            if (data?.creditCustomer) {
              await accountModel.findOneAndUpdate(
                { _id: account?._id },
                {
                  wallet: data?.creditCustomer?.credit,
                  currency: data?.creditCustomer?.currency,
                }
              );
            }
          } catch (error) {
            console.log("first", error);
          }
        });
      })
    );

    await queue.onIdle();

    console.log("REFETCHING_COMPLETED");
  } catch (error) {
    console.error("Account status fetch error: ", error);
  }
};
