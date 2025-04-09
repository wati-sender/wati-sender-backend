import { isValidObjectId } from "mongoose";
import templatesReportsModel from "../models/templatesReports.model.js";

// To get bulk template add reports
export const getAllBulkTemplateCreateReport = async (req, res) => {
  try {
    const { limit, page, search = "" } = req.query;
    const { userId } = req;

    let filter = { userId };

    if (search) {
      if (search) filter.templateName = { $regex: search, $options: "i" }; // Partial match, case-insensitive
    }
    const reports = await templatesReportsModel
      .find(filter)
      .limit(limit)
      .skip(limit * page)
      .sort({ createdAt: -1 });

    let totalCount;

    if (search) {
      totalCount = reports?.length;
    } else {
      totalCount = await templatesReportsModel.countDocuments();
    }
    return res
      .status(200)
      .json({ success: true, total: reports?.length, reports });
  } catch (error) {
    console.log("Templates reports get error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get template import reports",
      error: error.message,
    });
  }
};

// Get template import reports by id
export const getTemplateBulkCreateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId } = req;
    console.log("reportId: ", reportId);

    if (!reportId)
      return res.json({ success: false, message: "Please provide reportId" });

    if (!isValidObjectId(reportId))
      return res.json({ success: false, message: "Given ID is not valid" });

    const report = await templatesReportsModel.findOne({
      _id: reportId,
      userId,
    });

    // If report not found
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found for given ID." });

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.log("Template create reports get error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get template create",
      error: error.message,
    });
  }
};

// Delete template report by id
export const deleteSingleBulkCreateReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide reportId" });
    }

    if (!isValidObjectId(reportId))
      return res.json({ success: false, message: "Given ID is not valid" });

    // Permanently delete the report
    const deletedReport = await templatesReportsModel.findByIdAndDelete(
      reportId
    );

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

// Delete multiple create bulk reports
export const deleteMultipleTemplateCreateReport = async (req, res) => {
  try {
    const { reportIds } = req.body; // Expecting an array of userIds

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid reportIds array",
      });
    }

    // Permanently delete all accounts reports with matching reportIds
    const result = await templatesReportsModel.deleteMany({
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
    console.error("Multiple report delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete reports",
      error: error.message,
    });
  }
};
