import express from "express";
import {
  createTemplate,
  getAllTemplates,
  createTemplateInAllAccounts,
  getTemplateReviewStatus,
  templateById,
  submitTemplateForReview,
  deleteSingleTemplate,
} from "../controllers/template.js";
import { protectRequest } from "../middlewares/auth.middleware.js";

const TemplateRoutes = express.Router();

TemplateRoutes.post("/create", protectRequest, createTemplate);
TemplateRoutes.post(
  "/create/bulk",
  protectRequest,
  createTemplateInAllAccounts
);
TemplateRoutes.get("/all", protectRequest, getAllTemplates);
TemplateRoutes.post(
  "/check/review/status",
  protectRequest,
  getTemplateReviewStatus
);
TemplateRoutes.get("/:templateId", protectRequest, templateById);
TemplateRoutes.post("/review/submit", protectRequest, submitTemplateForReview);
TemplateRoutes.post("/delete/single", protectRequest, deleteSingleTemplate);
export default TemplateRoutes;
