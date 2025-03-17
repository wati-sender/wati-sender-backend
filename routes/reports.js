import express from "express";
import {
  deleteMultipleAccountsReport,
  deleteSingleAccountReport,
  getAccountImportReports,
  getAllAccountImportReports,
} from "../controllers/accountReports.js";
import { deleteMultipleTemplateCreateReport, deleteSingleBulkCreateReport, getAllBulkTemplateCreateReport, getTemplateBulkCreateReport } from "../controllers/templatesReports.js";
import { getAllBulkTemplateCreateReportIDS } from "../controllers/idsControllers.js";

const ReportsRoutes = express.Router();

/* ------------------------- Account import reports ------------------------- */
ReportsRoutes.get("/imports/accounts", getAllAccountImportReports);
ReportsRoutes.get("/imports/accounts/:importId", getAccountImportReports);
ReportsRoutes.post("/account/delete/single", deleteSingleAccountReport);
ReportsRoutes.post("/account/delete/multiple", deleteMultipleAccountsReport);

/* ------------------------- Template create reports ------------------------ */
ReportsRoutes.get("/template/bulkcreate", getAllBulkTemplateCreateReport);
ReportsRoutes.get("/template/bulkcreate/ids", getAllBulkTemplateCreateReportIDS);
ReportsRoutes.get("/template/bulkcreate/:reportId", getTemplateBulkCreateReport);
ReportsRoutes.post("/template/bulkcreate/delete/single", deleteSingleBulkCreateReport);
ReportsRoutes.post("/template/bulkcreate/delete/multiple", deleteMultipleTemplateCreateReport);

export default ReportsRoutes;
