import express from "express";
import { addBulkAccounts, getAllAccounts } from "../controllers/account.js";

const AccountRoutes = express.Router();

AccountRoutes.post("/add/bulk", addBulkAccounts);
AccountRoutes.get("/all", getAllAccounts);
export default AccountRoutes;
