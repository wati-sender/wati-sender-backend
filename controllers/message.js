import PQueue from "p-queue";
import axios from "axios";
import accountModel from "../models/account.model.js";
import campaignModel from "../models/campaign.model.js";
import { isValidObjectId } from "mongoose";
import { getEndOfTodayUTC } from "../utils/common.js";

export const sendBulkMessages = async (req, res) => {
  try {
    const {
      template_name,
      account_ids,
      broadcast_name,
      change_account_after_messages = 1000,
      receivers,
    } = req.body;

    if (!template_name || !broadcast_name)
      return res
        .status(400)
        .send("Template name and Broadcast name are required");
    if (
      !account_ids ||
      account_ids.length === 0 ||
      !receivers ||
      receivers?.length === 0
    )
      return res.status(400).send("Account ids and receivers are required");

    // If broadcast name already exist throw an error.
    const campaign = await campaignModel.findOne({ name: broadcast_name });
    if (campaign) {
      return res.status(400).send("Campaign with given name already exist.");
    }

    const allAccounts = await accountModel.find({ _id: { $in: account_ids } }); // Accounts filtered by account ids
    console.log(
      "Selected Accounts: ",
      allAccounts?.map((acc) => acc?.username)
    );
    console.log("Total Receivers: ", receivers?.length);

    if (!allAccounts.length) {
      return res.status(400).json({ message: "No accounts available" });
    }

    const queue = new PQueue({ concurrency: 1 }); // Only 1 batch sent at a time
    let BATCH_SIZE = receivers?.length / allAccounts?.length; // Number of messages per batch
    BATCH_SIZE = BATCH_SIZE >= 1 ? Math.ceil(BATCH_SIZE) : 1;
    let successCount = 0;
    let failCount = 0;
    let totalMessagesSent = 0;
    let currentAccountIndex = 0;
    let messagesCount = 0;
    let currentToken;
    const errors = []; // All errors

    // Helper: Split contacts into batches
    const chunkArray = (array, size) =>
      array.reduce((chunks, _, i) => {
        if (i % size === 0) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      }, []);

    // Contact batches
    const contactBatches = chunkArray(receivers, BATCH_SIZE);

    console.log("Starting Bulk Message Queue...");
    console.log("Batch Size: ", BATCH_SIZE);
    console.log("Receivers: ", receivers?.length);
    console.log("Accounts: ", allAccounts?.length);
    console.log("Contact Batches: ", contactBatches);

    res.status(200).json({
      success: true,
      message: "Bulk message processing started.",
      BATCH_SIZE,
    });

    // Process each batch
    await Promise.all(
      contactBatches.map((batch) =>
        queue.add(async () => {
          try {
            const currentAccount = allAccounts[currentAccountIndex];
            const client_id = currentAccount?.loginUrl?.split("/")[3];

            // If accounts not found throw an error
            if (!currentAccount) {
              throw new Error("No account available for processing");
            }

            // If token is not there login again with new account
            if (!currentToken) {
              currentToken = currentAccount.token;
            }

            // Prepare payload for the batch
            const payload = {
              template_name: template_name, // Ensure this is passed in the request
              broadcast_name: broadcast_name,
              receivers: batch.map((contact) => ({
                whatsappNumber: contact.whatsappNumber, // Update based on your schema
                customParams: contact.customParams || [], // Pass any dynamic parameters
              })),
            };

            // Send batch API request
            const response = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v2/sendTemplateMessages`,
              payload,
              { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            console.log(
              `Batch sent with ${batch.length} messages using account ${currentAccount?.username}`
            );
            console.log("Response: ", response?.data);

            if (response?.data?.result) {
              successCount += batch.length;
            } else {
              failCount += batch.length;
              errors.push({
                username: currentAccount.username,
                name: currentAccount?.name,
                error: response?.data?.error,
              });
            }
            messagesCount += batch.length;
            totalMessagesSent += batch.length;

            // Check if the account has reached its 1000-message limit
            if (messagesCount >= BATCH_SIZE) {
              currentAccountIndex++;
              messagesCount = 0;
              currentToken = null;

              if (currentAccountIndex >= allAccounts.length) {
                throw new Error(
                  "All accounts exhausted. No more accounts available."
                );
              }
            }
          } catch (error) {
            if (!error.message.includes("accounts exhausted")) {
              failCount += batch.length; // Assume the whole batch failed
            } else {
              console.error(`Error sending batch:`, error.message);
            }
          }
        })
      )
    );

    await queue.onIdle();

    // Add new campaign entry
    const newCampaign = new campaignModel({
      name: broadcast_name,
      totalContacts: receivers?.length,
      selectedAccounts: allAccounts?.map((acc) => acc?._id),
      selectedTemplateName: template_name,
      successCount,
      failedCount: failCount,
      errors,
    });

    await newCampaign.save();

    console.log({
      message: "Bulk message processing completed.",
      successCount,
      failCount,
      totalMessagesSent,
    });
    console.log(
      `Results: Success: ${successCount}, Failures: ${failCount}, Total Messages: ${totalMessagesSent}`
    );
  } catch (error) {
    console.error("Error in bulk message sending:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignModel
      .find()
      .populate("selectedAccounts", "-token")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, campaigns });
  } catch (error) {
    console.log("All campaigns get error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get campaign by id
export const getCampaignByID = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignModel
      .findById(campaignId)
      .sort({ createdAt: -1 })
      .populate("selectedAccounts");

    const selectedAccounts = campaign?.selectedAccounts || [];

    const queue = new PQueue({ concurrency: 5 }); // Only 5 batch sent at a time
    console.log("selected:accounts: ", campaign);

    let totalProcessing = 0;
    let totalQueued = 0;
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpen = 0;
    let totalReplied = 0;
    let totalFailed = 0;
    let totalStopped = 0;
    let totalSending = 0;

    // Get exact report from wati
    await Promise.all(
      selectedAccounts?.map((account) =>
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];
            const { data } = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/broadcast/getBroadcastsOverview`,
              {
                dateFrom: "2025-02-24T00:00:00.000Z",
                dateTo: getEndOfTodayUTC(),
                searchString: campaign?.name || "",
                sortBy: 0,
                filterStatus: [],
                pageSize: 5,
                pageNumber: 0,
              },
              { headers: { Authorization: `Bearer ${account?.token}` } }
            );
            console.log("Campaign Report: ", data);

            if (data?.ok) {
              const { result } = data || {};
              totalProcessing += result.totalProcessing || 0;
              totalQueued += result.totalQueued || 0;
              totalSent += result.totalSent || 0;
              totalDelivered += result.totalDelivered || 0;
              totalOpen += result.totalOpen || 0;
              totalReplied += result.totalReplied || 0;
              totalFailed += result.totalFailed || 0;
              totalStopped += result.totalStopped || 0;
              totalSending += result.totalSending || 0;
            }
          } catch (error) {
            console.error("Error to get all campaign reports:", error.message);
          }
        })
      )
    );

    return res.status(200).json({
      success: true,
      statistics: {
        totalProcessing,
        totalQueued,
        totalSent,
        totalDelivered,
        totalOpen,
        totalReplied,
        totalFailed,
        totalStopped,
        totalSending,
      },
    });
  } catch (error) {
    console.log("Get all campaign report error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get campaign statistics for particular account
export const getCampaignReportByAccount = async (req, res) => {
  try {
    const { campaignId, accountId } = req.body;
    if (
      !campaignId ||
      !isValidObjectId(campaignId) ||
      !accountId ||
      !isValidObjectId(accountId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid campaignId and accountId",
      });
    }

    const campaign = await campaignModel.findById(campaignId);

    if (!campaign) {
      return res
        .status(400)
        .json({ success: false, message: "Campaign not found with given ID" });
    }

    const account = await accountModel.findById(accountId);

    const client_id = account?.loginUrl.split("/")[3];
    console.log("DATE", getEndOfTodayUTC());
    const campaignStatsResponse = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/broadcast/getBroadcastsOverview`,
      {
        dateFrom: "2025-02-24T00:00:00.000Z",
        dateTo: getEndOfTodayUTC(),
        searchString: campaign?.name || "",
        sortBy: 0,
        filterStatus: [],
        pageSize: 1,
        pageNumber: 0,
      },
      { headers: { Authorization: `Bearer ${account?.token}` } }
    );

    if (!campaignStatsResponse.data?.ok) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to get campaign statistics" });
    }
    const campaignStats = campaignStatsResponse?.data?.result;
    console.log("Campaign Statistics: ", campaignStats);
    return res.status(200).json({
      success: true,
      account: {
        _id: account?._id,
        name: account?.name,
        phone: account?.phone,
        username: account?.username,
      },
      statistics: campaignStats,
    });
    res.status(200).send("Suc");
  } catch (error) {
    console.log("Campaign account report error: ", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};
