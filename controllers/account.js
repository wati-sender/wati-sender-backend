import PQueue from "p-queue";
import accountModel from "../models/account.model.js";
import { asyncForEach, escapeRegExpChars } from "../utils/common.js";
import { getAccountStatus, loginAndGetToken } from "./auth.js";
import accountsReportModel from "../models/accountsReport.model.js";

export const addBulkAccounts = async (req, res) => {
  try {
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
      limit,
      page,
      search = "",
    } = req.query;

    let filter = {};

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

    const allAccounts = await accountModel
      .find(filter)
      .limit(limit)
      .skip(limit * page)
      .sort({ createdAt: -1 });

    console.log("FILTERS: ", filter);
    console.log("FOUND ACCOUNTS: ", allAccounts);

    let connectedAccounts = 0;
    let notConnectedAccounts = 0;
    let allVerificationsCount = 0;
    let verificationFailed = 0;
    const errors = [];
    const filteredAccounts = [];

    // If account_status is passed rating also required, if rating passed account_status is required.
    // if (
    //   (account_status && !quality_rating) ||
    //   (!account_status && quality_rating)
    // )
    //   return res
    //     .status(400)
    //     .send("Account status and quality rating both are required.");

    const selectedQualities = quality_rating.split("_");

    const selectedAccountStatuses = account_status.split("_");

    console.log("Selected Account Statuses: ", selectedQualities);
    console.log("Selected Account Qualities: ", selectedQualities);

    const queue = new PQueue({ concurrency: 100 }); // Request to send one time

    // Process each account
    await Promise.all(
      allAccounts.map((account, i) =>
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];
            const token = account.token;
            if (!token) {
              // If login fail
              verificationFailed++;
            } else {
              const accountStatus = await getAccountStatus(token, client_id);
              console.log("status:", accountStatus);

              if (accountStatus?.status === "CONNECTED") {
                // If account is connected
                connectedAccounts++;
              } else {
                // If account is not connected. It can be ban or restricted
                notConnectedAccounts++;
              }

              // If not filter applied send all accounts
              if (!account_status && !quality_rating) {
                console.log("STATUS: ", accountStatus);
                filteredAccounts[i] = {
                  status: accountStatus?.status,
                  quality_rating: accountStatus?.qualityRating,
                  name: account?.name,
                  username: account?.username,
                  loginUrl: account?.loginUrl,
                  password: account?.password,
                  phone: account?.phone,
                  _id: account?._id,
                };
              } else {
                // Filter accounts based on selected status and quality rating
                if (
                  (selectedAccountStatuses?.length > 0 &&
                    selectedAccountStatuses.includes(accountStatus?.status)) ||
                  (selectedQualities?.length > 0 &&
                    selectedQualities.includes(accountStatus?.qualityRating))
                ) {
                  // If filtered are matched, push the account into filteredAccounts
                  filteredAccounts[i] = {
                    status: accountStatus?.status,
                    quality_rating: accountStatus?.qualityRating,
                    name: account?.name,
                    username: account?.username,
                    loginUrl: account?.loginUrl,
                    password: account?.password,
                    phone: account?.phone,
                    _id: account?._id,
                  };
                }
              }

              allVerificationsCount++;

              // Update status in db as well
              account.status = accountStatus?.status;
              await account.save();
            }
          } catch (error) {
            errors.push(error.message);
            console.error(`Error Getting Account Status:`, error.message);
          }
        })
      )
    );

    let totalCount;

    if (search || account_status || quality_rating) {
      totalCount = filteredAccounts?.length;
    } else {
      totalCount = await accountModel.countDocuments();
    }
    return res.status(200).json({
      total: totalCount,
      errors,
      accounts: filteredAccounts,
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
