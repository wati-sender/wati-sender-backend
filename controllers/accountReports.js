import { isValidObjectId } from "mongoose";
import accountsReportModel from "../models/accountsReport.model.js";

// To get all import reports
export const getAllAccountImportReports = async (req, res) => {
  try {
    const reports = await accountsReportModel.find().sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, total: reports?.length, reports });
  } catch (error) {
    console.log("Account reports get error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get account import reports",
      error: error.message,
    });
  }
};

// Get account import reports by id
export const getAccountImportReports = async (req, res) => {
  try {
    const { importId } = req.params;
    console.log("Import id: ", importId);

    if (!importId)
      return res.json({ success: false, message: "Please provide importID" });

    if (!isValidObjectId(importId))
      return res.json({ success: false, message: "Given ID is not valid" });

    const report = await accountsReportModel.findById(importId);

    // If report not found
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found for given ID." });

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.log("Account reports get error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get account import reports",
      error: error.message,
    });
  }
};

// Delete account report
export const deleteSingleAccountReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide reportId" });
    }

    // Permanently delete the report
    const deletedReport = await accountsReportModel.findByIdAndDelete(reportId);

    if (!deletedReport) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Single report delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};

// Delete multiple account reports
export const deleteMultipleAccountsReport = async (req, res) => {
  try {
    const { reportIds } = req.body; // Expecting an array of userIds

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid reportIds array",
      });
    }

    // Permanently delete all accounts reports with matching reportIds
    const result = await accountsReportModel.deleteMany({
      _id: { $in: reportIds },
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No reports found to delete" });
    }

    res.status(200).json({
      success: true,
      message: "Reports deleted successfully",
    });
  } catch (error) {
    console.error("Multiple account delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};
