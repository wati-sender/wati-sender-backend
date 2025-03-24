import PQueue from "p-queue";
import axios from "axios";
import accountModel from "../models/account.model.js";
import campaignModel from "../models/campaign.model.js";
import { isValidObjectId } from "mongoose";
import {
  distributeContactsToAccounts,
  escapeRegExpChars,
  getEndOfLastMonthUTC,
  getEndOfTodayUTC,
} from "../utils/common.js";

export const sendBulkMessages = async (req, res) => {
  try {
    const { template_name, account_ids, broadcast_name, receivers } = req.body;
    // Example Usage:

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

    const allAccounts = await accountModel
      .find({ _id: { $in: account_ids } })
      .select("+token"); // Accounts filtered by account ids

    if (!allAccounts.length) {
      return res.status(400).json({ message: "No accounts available" });
    }
    console.log(
      "Selected Accounts: ",
      allAccounts?.map((acc) => acc?.username)
    );
    console.log("Total Receivers: ", receivers?.length);

    console.log(
      "BATCH_SIZE",
      Math.floor(receivers?.length / allAccounts?.length)
    );

    res.status(200).json({
      success: true,
      message: "Bulk message processing started.",
      batchSize: Math.floor(receivers?.length / allAccounts?.length),
    });

    // Distributing contacts based on accounts
    const result = distributeContactsToAccounts(receivers, allAccounts);

    const queue = new PQueue({
      concurrency: Math.floor(allAccounts?.length),
    }); // Send all request at once

    const errors = [];

    await Promise.all(
      result?.map((account) => {
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];

            const payload = {
              template_name: template_name, // Ensure this is passed in the request
              broadcast_name: broadcast_name,
              receivers: account?.contacts,
            };

            // Send batch API request
            const response = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v2/sendTemplateMessages`,
              payload,
              { headers: { Authorization: `Bearer ${account?.token}` } }
            );

            if (response?.data?.result) {
              console.log(
                `Campaign sent from ${account?.username} to ${account?.contacts?.length} contacts.`
              );
            } else {
              console.log("Error ELSE Block: ", response?.data);
              errors.push({
                username: account.username,
                name: account?.name,
                error: response?.data?.error,
              });
            }
          } catch (error) {
            console.log("Error CATCH Block: ", error);
            errors.push({
              username: account.username,
              name: account?.name,
              error: error,
            });
          }
        });
      })
    );

    await queue.onIdle();
    // Add new campaign entry
    const newCampaign = new campaignModel({
      name: broadcast_name,
      totalContacts: receivers?.length,
      selectedAccounts: allAccounts?.map((acc) => acc?._id),
      selectedTemplateName: template_name,
      errors,
    });

    await newCampaign.save();
  } catch (error) {
    console.log("Error: ", error);
    console.error("Error in bulk message sending:", error.message);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const { limit, page, search = "" } = req.query;

    const filter = {};
    if (search) {
      // filter.name = { $regex: search, $options: "i" };

      if (search) {
        filter.$or = [
          {
            name: {
              $regex: escapeRegExpChars(search),
              $options: "i",
            },
          },
          {
            selectedTemplateName: {
              $regex: escapeRegExpChars(search),
              $options: "i",
            },
          },
        ];
      }
      // filter.selectedTemplateName = { $regex: search, $options: "i" };
    } // Partial match, case-insensitive

    const campaigns = await campaignModel
      .find(filter)
      .limit(limit)
      .skip(limit * page)
      .sort({ createdAt: -1 });

    let totalCount;

    if (search) {
      totalCount = campaigns?.length;
    } else {
      totalCount = await campaignModel.countDocuments();
    }
    return res
      .status(200)
      .json({ success: true, total: totalCount, campaigns });
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

    let campaignResp = {
      _id: campaign?._id,
      name: campaign?.name,
      selectedTemplateName: campaign?.selectedTemplateName,
      errors: campaign?.errors,
      createdAt: "2025-03-09T13:18:31.702Z",
      updatedAt: "2025-03-09T13:18:31.702Z",
      totalContacts: campaign?.totalContacts,
      selectedAccounts: campaign?.selectedAccounts?.map((acc) => ({
        _id: acc?._id,
        name: acc?.name,
        phone: acc?.phone,
        username: acc?.username,
        password: acc?.password,
        loginUrl: acc?.loginUrl,
        status: acc?.status,
        qualityRating: acc?.qualityRating,
        wallet: acc?.wallet,
        messageTier: acc?.messageTier,
        currency: acc?.currency,
        createdAt: "2025-03-08T12:46:56.842Z",
        updatedAt: "2025-03-08T12:46:56.842Z",
      })),
    };
    return res.status(200).json({
      success: true,
      campaign: campaignResp
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

    const { data: campaignData } = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/broadcast`,
      {
        dateFrom: getEndOfLastMonthUTC(), // To only get last 7 days of report
        dateTo: getEndOfTodayUTC(),
        searchString: campaign?.name || "",
        sortBy: 0,
        filterStatus: [],
        pageSize: 1000,
        pageNumber: 0,
      },
      { headers: { Authorization: `Bearer ${account?.token}` } }
    );

    if (campaignData?.ok) {
      const exactCampaign = campaignData?.result?.items?.find(
        (camp) => camp?.broadcastName === campaign?.name
      );
      console.log("EXACT_CAMPAIGN: ", exactCampaign);

      // Fetch the statistics of that campaign
      if (exactCampaign && exactCampaign?.id) {
        const { data: campaignStats } = await axios.get(
          `${process.env.WATI_API_URL}/${client_id}/api/v1/broadcast/analyticsL2/${exactCampaign?.id}`,
          { headers: { Authorization: `Bearer ${account?.token}` } }
        );

        console.log("EXACT_CAMPAIGN_STATISTICS: ", campaignStats);
        const { result } = campaignStats || {};
        return res.status(200).json({
          success: true,
          account: {
            _id: account?._id,
            name: account?.name,
            phone: account?.phone,
            username: account?.username,
          },
          broadcast: {
            wati_broadcastId: result?.id,
            name: result?.broadcastName,
            status: result?.status,
            sentAt: result?.scheduledAt,
          },
          statistics: {
            total: result?.recipients,
            read: result?.read,
            ignored: result?.ignored,
            failed: result?.failed,
            replied: result?.replied,
          },
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `${campaign?.name} campaign not found in WATI`,
        });
      }
    } else {
      return res
        .status(500)
        .json({
          success: false,
          message: `Failed to get ${campaign?.name} from WATI`,
        });
    }
  } catch (error) {
    console.log("Campaign account report error: ", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};
