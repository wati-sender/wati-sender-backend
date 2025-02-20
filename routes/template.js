import express from "express";
import {
  createTemplate,
  getAllTemplates,
  createTemplateInAllAccounts,
  getTemplateReviewStatus,
} from "../controllers/template.js";

const TemplateRoutes = express.Router();

TemplateRoutes.post("/create", createTemplate);
TemplateRoutes.post("/create/bulk", createTemplateInAllAccounts);
TemplateRoutes.get("/:client_id/all", getAllTemplates);
TemplateRoutes.post("/check/review/status",getTemplateReviewStatus)
export default TemplateRoutes;
