import express from "express";
import {
  createTemplate,
  getAllTemplates,
  createTemplateInAllAccounts,
  getTemplateReviewStatus,
  templateById,
} from "../controllers/template.js";

const TemplateRoutes = express.Router();

TemplateRoutes.post("/create", createTemplate);
TemplateRoutes.post("/create/bulk", createTemplateInAllAccounts);
TemplateRoutes.get("/all", getAllTemplates);
TemplateRoutes.post("/check/review/status",getTemplateReviewStatus);
TemplateRoutes.get("/:templateId",templateById)
export default TemplateRoutes;
