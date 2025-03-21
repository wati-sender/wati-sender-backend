import express from "express";
import {
  addBulkAccounts,
  deleteMultipleAccounts,
  deleteSingleAccount,
  getAllAccounts,
  refetchAccountStatus,
  refetchAccountWallet,
} from "../controllers/account.js";
import { getAccountIds } from "../controllers/idsControllers.js";

const AccountRoutes = express.Router();

AccountRoutes.post("/add/bulk", addBulkAccounts);
AccountRoutes.get("/all", getAllAccounts);
AccountRoutes.post("/delete/single", deleteSingleAccount);
AccountRoutes.post("/delete/multiple", deleteMultipleAccounts);
AccountRoutes.get("/all/ids", getAccountIds);
AccountRoutes.get("/status/refetch", refetchAccountStatus);
AccountRoutes.get("/wallet/refetch", refetchAccountWallet);
export default AccountRoutes;
