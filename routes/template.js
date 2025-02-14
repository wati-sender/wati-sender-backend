import express from "express";
import {
  createTemplate,
  getAllTemplates,
  createTemplateInAllAccounts,
} from "../controllers/template.js";

const TemplateRoutes = express.Router();

TemplateRoutes.post("/create", createTemplate);
TemplateRoutes.post("/create/bulk", createTemplateInAllAccounts);
TemplateRoutes.get("/:client_id/all", getAllTemplates);
export default TemplateRoutes;
