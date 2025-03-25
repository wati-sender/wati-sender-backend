import express from "express";
import {
  getAllCampaigns,
  getCampaignByID,
  getCampaignStats,
  getCampaignReportByAccount,
  sendBulkMessages,
} from "../controllers/message.js";

const MessagesRoutes = express.Router();

MessagesRoutes.post("/send/bulk", sendBulkMessages);
MessagesRoutes.get("/campaigns", getAllCampaigns);
MessagesRoutes.post("/campaigns/statistics", getCampaignStats);
MessagesRoutes.get("/campaigns/:campaignId", getCampaignByID);
MessagesRoutes.post("/campaign/report/account", getCampaignReportByAccount);
export default MessagesRoutes;
