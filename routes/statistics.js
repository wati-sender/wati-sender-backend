import express from "express";
import { getStatistics } from "../controllers/statistics.js";

const StatisticsRoutes = express.Router();

StatisticsRoutes.post("/get", getStatistics);
export default StatisticsRoutes;
