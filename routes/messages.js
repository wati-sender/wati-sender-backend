import express from "express";
import {
  getAllCampaigns,
  getCampaignByID,
  getCampaignStats,
  getCampaignReportByAccount,
  sendBulkMessages,
} from "../controllers/message.js";
import { protectRequest } from "../middlewares/auth.middleware.js";

const MessagesRoutes = express.Router();

MessagesRoutes.post("/send/bulk", protectRequest, sendBulkMessages);
MessagesRoutes.get("/campaigns", protectRequest, getAllCampaigns);
MessagesRoutes.post("/campaigns/statistics", protectRequest, getCampaignStats);
MessagesRoutes.get("/campaigns/:campaignId", protectRequest, getCampaignByID);
MessagesRoutes.post(
  "/campaign/report/account",
  protectRequest,
  getCampaignReportByAccount
);
export default MessagesRoutes;
