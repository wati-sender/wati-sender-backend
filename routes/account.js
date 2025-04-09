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
import { protectRequest } from "../middlewares/auth.middleware.js";

const AccountRoutes = express.Router();

AccountRoutes.post("/add/bulk", protectRequest, addBulkAccounts);
AccountRoutes.get("/all", protectRequest, getAllAccounts);
AccountRoutes.post("/delete/single", protectRequest, deleteSingleAccount);
AccountRoutes.post("/delete/multiple", protectRequest, deleteMultipleAccounts);
AccountRoutes.get("/all/ids", protectRequest, getAccountIds);
AccountRoutes.get("/status/refetch", protectRequest, refetchAccountStatus);
AccountRoutes.get("/wallet/refetch", protectRequest, refetchAccountWallet);
export default AccountRoutes;
