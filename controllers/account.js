import PQueue from "p-queue";
import accountModel from "../models/account.model.js";
import { asyncForEach } from "../utils/common.js";
import { getAccountStatus, loginAndGetToken } from "./auth.js";

export const addBulkAccounts = async (req, res) => {
  try {
    const { accounts } = req.body;
    const inserted = [];
    const failed = [];
    const exist = [];
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
      if (!existingAccount) {
        const token = await loginAndGetToken(username, password, client_id);
        console.log("Token: ", token);
        const newAccount = new accountModel({
          name,
          phone,
          username,
          password,
          loginUrl,
          token: token || "",
        });

        await newAccount.save();
        if (!newAccount) {
          failed.push(index);
        } else {
          inserted.push(index);
        }
      } else {
        exist.push(index);
      }
    });

    return res.status(200).json({
      status: true,
      message:
        exist?.length === accounts?.length
          ? "All accounts are already exists"
          : "Bulk accounts added successfully",
      inserted: inserted.length,
      exist: exist.length,
      failed: failed.length,
    });
  } catch (error) {
    console.log("Add Bulk Accounts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAccounts = async (req, res) => {
  try {
    const { account_status, quality_rating } = req.query;
    const allAccounts = await accountModel.find().sort({ createdAt: -1 });
    let connectedAccounts = 0;
    let notConnectedAccounts = 0;
    let allVerificationsCount = 0;
    let verificationFailed = 0;
    const errors = [];
    const filteredAccounts = [];

    // If not filter applied send all accounts
    if (!account_status && !quality_rating)
      return res
        .status(200)
        .json({ total: allAccounts?.length, accounts: allAccounts });

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
      allAccounts.map((account) =>
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

              if (
                selectedAccountStatuses.includes(accountStatus?.status) &&
                selectedQualities.includes(accountStatus?.qualityRating)
              ) {
                // If filtered are matched push in the filtered accounts
                filteredAccounts.push(account);
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

    return res.status(200).json({
      total: filteredAccounts?.length,
      connectedAccounts,
      notConnectedAccounts,
      allVerificationsCount,
      errors,
      accounts: filteredAccounts,
    });
  } catch (error) {
    console.log("Get All Accounts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
