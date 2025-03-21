import express from "express";
import dotenv from "dotenv";
import TemplateRoutes from "./routes/template.js";
import AuthRoutes from "./routes/auth.js";
import cors from "cors";
import connectToDB from "./lib/connectToDB.js";
import ContactRoutes from "./routes/contact.js";
import AccountRoutes from "./routes/account.js";
import MessagesRoutes from "./routes/messages.js";
import StatisticsRoutes from "./routes/statistics.js";
import ReportsRoutes from "./routes/reports.js";
import MediaRoutes from "./routes/mediaRoutes.js";
import cron from "node-cron";
import { refetchAccountStatus, refetchAccountWallet } from "./controllers/account.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

connectToDB();

// Cron job to fetch account status AND WALLET every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("Running task every 30 minutes:", new Date().toLocaleTimeString());
  refetchAccountStatus();
  refetchAccountWallet();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", AuthRoutes);
app.use("/api/templates", TemplateRoutes);
app.use("/api/contacts", ContactRoutes);
app.use("/api/accounts", AccountRoutes);
app.use("/api/messages", MessagesRoutes);
app.use("/api/statistics", StatisticsRoutes);
app.use("/api/reports", ReportsRoutes);
app.use("/api/media", MediaRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
