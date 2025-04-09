import express from "express";
import {
  deleteMultipleAccountsReport,
  deleteSingleAccountReport,
  getAccountImportReports,
  getAllAccountImportReports,
} from "../controllers/accountReports.js";
import {
  deleteMultipleTemplateCreateReport,
  deleteSingleBulkCreateReport,
  getAllBulkTemplateCreateReport,
  getTemplateBulkCreateReport,
} from "../controllers/templatesReports.js";
import { getAllBulkTemplateCreateReportIDS } from "../controllers/idsControllers.js";
import { protectRequest } from "../middlewares/auth.middleware.js";

const ReportsRoutes = express.Router();

/* ------------------------- Account import reports ------------------------- */
ReportsRoutes.get(
  "/imports/accounts",
  protectRequest,
  getAllAccountImportReports
);
ReportsRoutes.get(
  "/imports/accounts/:importId",
  protectRequest,
  getAccountImportReports
);
ReportsRoutes.post(
  "/account/delete/single",
  protectRequest,
  deleteSingleAccountReport
);
ReportsRoutes.post(
  "/account/delete/multiple",
  protectRequest,
  deleteMultipleAccountsReport
);

/* ------------------------- Template create reports ------------------------ */
ReportsRoutes.get(
  "/template/bulkcreate",
  protectRequest,
  getAllBulkTemplateCreateReport
);
ReportsRoutes.get(
  "/template/bulkcreate/ids",
  protectRequest,
  getAllBulkTemplateCreateReportIDS
);
ReportsRoutes.get(
  "/template/bulkcreate/:reportId",
  protectRequest,
  getTemplateBulkCreateReport
);
ReportsRoutes.post(
  "/template/bulkcreate/delete/single",
  protectRequest,
  deleteSingleBulkCreateReport
);
ReportsRoutes.post(
  "/template/bulkcreate/delete/multiple",
  protectRequest,
  deleteMultipleTemplateCreateReport
);

export default ReportsRoutes;
