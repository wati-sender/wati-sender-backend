import express from "express";
import {
  getAllCampaigns,
  getCampaignByID,
  getCampaignErrors,
  getCampaignReportByAccount,
  sendBulkMessages,
} from "../controllers/message.js";

const MessagesRoutes = express.Router();

MessagesRoutes.post("/send/bulk", sendBulkMessages);
MessagesRoutes.get("/campaigns", getAllCampaigns);
MessagesRoutes.post("/campaigns/errors", getCampaignErrors);
MessagesRoutes.get("/campaigns/:campaignId", getCampaignByID);
MessagesRoutes.post("/campaign/report/account", getCampaignReportByAccount);
export default MessagesRoutes;
