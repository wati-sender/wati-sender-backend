import express from "express";
import {
  addBulkAccounts,
  deleteMultipleAccounts,
  deleteSingleAccount,
  getAllAccounts,
} from "../controllers/account.js";

const AccountRoutes = express.Router();

AccountRoutes.post("/add/bulk", addBulkAccounts);
AccountRoutes.get("/all", getAllAccounts);
AccountRoutes.post("/delete/single", deleteSingleAccount);
AccountRoutes.post("/delete/multiple", deleteMultipleAccounts);
export default AccountRoutes;
