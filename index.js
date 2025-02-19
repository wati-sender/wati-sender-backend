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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectToDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", AuthRoutes);
app.use("/templates", TemplateRoutes);
app.use("/contacts", ContactRoutes);
app.use("/accounts", AccountRoutes);
app.use("/messages", MessagesRoutes);
app.use("/statistics", StatisticsRoutes);
app.use("/reports", ReportsRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
