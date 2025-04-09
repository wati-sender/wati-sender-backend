import express from "express";
import { getStatistics } from "../controllers/statistics.js";
import { protectRequest } from "../middlewares/auth.middleware.js";

const StatisticsRoutes = express.Router();

StatisticsRoutes.post("/get", protectRequest, getStatistics);
export default StatisticsRoutes;
