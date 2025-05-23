import axios from "axios";
import accountModel from "../models/account.model.js";
import PQueue from "p-queue";
import templatesReportsModel from "../models/templatesReports.model.js";
import { isValidObjectId } from "mongoose";
import { asyncForEach } from "../utils/common.js";
import templateModel from "../models/template.model.js";
import watiTemplatesIdsModel from "../models/watiTemplatesIds.model.js";
import { loginAndGetToken } from "./auth.js";

// For creating single template
// ! Not in use
export const createTemplate = async (req, res) => {
  try {
    const {
      header,
      elementName,
      body,
      customParams,
      buttons,
      footer,
      client_id,
      category,
      subCategory,
      buttonsType,
    } = req.body;
    const token = req.headers.authorization;

    const response = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/create`,
      {
        type: "template",
        category,
        subCategory,
        buttons,
        footer,
        header,
        elementName,
        body,
        customParams,
        language: "en",
        buttonsType,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (!response?.data?.ok) {
      return res.status(400).json({ message: response?.data?.result });
    }

    // Adding template for review
    const submitResponse = await axios.get(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/submit/${response?.data?.result?.id}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (!submitResponse?.data?.ok) {
      return res.status(400).json({ message: "Template review failed" });
    }

    res.status(201).json({
      success: true,
      message: "Template created successfully and in under review",
      template: response?.data,
    });
  } catch (error) {
    console.log("Create Template OR Review request Error: ", error);
    res.status(500).json({ error: error });
  }
};

// Function to get all templates of user
export const getAllTemplates = async (req, res) => {
  try {
    const { limit, page, search = "" } = req.query;
    const { userId } = req;

    let filter = { userId };

    if (search) filter.name = { $regex: search, $options: "i" }; // Partial match, case-insensitive

    const templates = await templateModel
      .find(filter)
      .limit(limit)
      .skip(limit * page)
      .select("-accountsToAdd")
      .sort({ createdAt: -1 });

    let totalCount;

    if (search) {
      totalCount = templates?.length;
    } else {
      totalCount = await templateModel.countDocuments({ userId });
    }

    return res.status(200).json({
      success: true,
      total: totalCount,
      templates,
    });
  } catch (error) {
    console.log("Get All Templates Error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to get templates",
      error: error,
    });
  }
};

// Create a template using a token
const createTemplateBulk = async (token, templateData, client_id) => {
  try {
    const response = await axios.post(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/create`,
      templateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "*/*",
        },
      }
    );

    console.log("Template creation result: ", response?.data);
    if (!response?.data?.ok) {
      return { success: false, error: response?.data };
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "Template creation failed:",
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
};

// Function to create template in all accounts at a time
export const createTemplateInAllAccounts = async (req, res) => {
  try {
    const {
      startAccountIndex,
      endAccountIndex,
      template: templateData,
    } = req.body;

    const { userId } = req;

    // Template name validation
    if (!/^[a-z0-9_]+$/.test(templateData?.elementName))
      return res
        .status(400)
        .send(
          "The template name can only contain lower-case letters and underscores."
        );

    if (!startAccountIndex || !endAccountIndex)
      return res
        .status(400)
        .send("Start account index and End account index are required");

    if (startAccountIndex > endAccountIndex)
      return res.status(400).json({
        success: false,
        message: "End account index must be greater than start index",
      });

    // If template in our db is present
    const isExist = await templateModel.findOne({
      name: templateData?.elementName,
      userId,
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Template name already exist",
      });
    }

    const allAccounts = await accountModel
      .find({ userId })
      .sort({ createdAt: -1 });

    const accounts = allAccounts?.filter(
      (_, i) => i >= startAccountIndex - 1 && i <= endAccountIndex - 1
    );

    if (!templateData) {
      return res.status(500).send("Template is required");
    }

    if (accounts?.length === 0) {
      return res.status(200).send("Accounts not found");
    }

    // Create a queue with a concurrency limit (e.g., 5 requests at a time)
    const queue = new PQueue();

    // Counters for success, failures, and review
    const createSuccessUserNames = [];
    const createFailedUserNames = [];

    console.log("Selected accounts: ", accounts);
    console.log("Queue started");
    const accountsCreatedInOneMinute = 12;
    const timeToWaitPerAccountInMinutes = 1 / accountsCreatedInOneMinute; // 1 minute for 12 accounts

    let waitTimeInMinutes =
      (accounts?.length || 0) * timeToWaitPerAccountInMinutes;

    // If the wait time is less than 1 minute, set it to 1 minute
    if (waitTimeInMinutes < 1) {
      waitTimeInMinutes = 1;
    }

    res.status(200).json({
      success: true,
      message: `Template creation has been started, Please wait for ${waitTimeInMinutes.toFixed(
        2
      )} minutes.`,
    });

    // ******************************
    await Promise.all(
      accounts.map((account) =>
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];
            let token = account.token;
            console.log(
              "DATA: ",
              account.username,
              account.password,
              client_id
            );
            if (!token) {
              token = await loginAndGetToken(
                account?.username,
                account?.password,
                client_id
              );
            }

            if (token) {
              // If login success
              let response = await createTemplateBulk(
                token,
                templateData,
                client_id
              );
              console.log("REsponse: ", response);
              console.log("account: ", account);

              if (!response?.success) {
                if (response?.error?.includes("401")) {
                  token = await loginAndGetToken(
                    account?.username,
                    account?.password,
                    client_id
                  );

                  response = await createTemplateBulk(
                    token,
                    templateData,
                    client_id
                  );

                  await accountModel.findOneAndUpdate(
                    { _id: account?._id, userId },
                    { token: token }
                  );
                }
              }

              if (response.success) {
                // If template create success
                createSuccessUserNames.push(account.username);
                console.log(
                  `Template created successfully for ${account.username}`
                );

                // Template data to send for review

                const newTempEntry = new watiTemplatesIdsModel({
                  accountId: account?._id,
                  watiTemplateId: response?.data?.result?.id,
                  templateName: templateData?.elementName,
                  userId,
                });

                await newTempEntry.save();
              } else {
                // If template create fails
                createFailedUserNames.push(account.username);
                console.error(
                  `Failed to create template for ${account.username}: ${response.error}`
                );
              }
            } else {
              // If Login fail
              createFailedUserNames.push(account.username);
              console.error(
                `Skipping template creation for ${account.username} due to login failure.`
              );
            }
          } catch (error) {
            console.log("Error: ", error);
            createFailedUserNames.push(account.username);
            console.error(
              `Error processing ${account.username}: ${error.message}`
            );
          }
        })
      )
    );

    await queue.onIdle();

    // Save template report
    const templateCreateBulkReport = new templatesReportsModel({
      templateName: templateData?.elementName,
      totalAccounts: accounts?.length,
      success: createSuccessUserNames,
      failed: createFailedUserNames,
      userId,
    });

    // New template entry.
    const template = new templateModel({
      name: templateData?.elementName,
      accountsToAdd: accounts?.map((acc) => acc._id),
      failedCount: createFailedUserNames?.length,
      successCount: createSuccessUserNames?.length,
      templateData,
      userId,
    });

    await template.save();

    // Save template report
    await templateCreateBulkReport.save();

    console.log("All accounts processed.");
    console.log(
      `Success: ${createSuccessUserNames.length}, Failures: ${createFailedUserNames.length} `
    );
  } catch (error) {
    console.error("Bulk Template Create Error: ", error);
    res.status(500).json({
      message: "An error occurred while processing accounts.",
      error: error.message,
    });
  }
};

// Get review status, based on accounts.

export const getTemplateReviewStatus = async (req, res) => {
  try {
    const { reportId } = req.body;
    const { userId } = req;

    if (!reportId)
      return res.json({ success: false, message: "Please provide reportId" });

    if (!isValidObjectId(reportId))
      return res.json({ success: false, message: "Given ID is not valid" });

    // Need usernames to get status in that account.
    const report = await templatesReportsModel.findOne({
      _id: reportId,
      userId,
    });

    if (!report) {
      return res.json({
        success: false,
        message: "Report not found for given ID",
      });
    }

    // All usernames (Selected for bulk template create);
    const usernames = [...report.success, ...report.failed];

    // Get account from DB to get token of that account.
    const accounts = await accountModel.find({
      username: { $in: usernames },
      userId,
    });

    // Status result
    const result = [];

    const queue = new PQueue({
      concurrency: Math.floor(accounts?.length),
    }); // Send all request at once

    await Promise.all(
      accounts?.map((account, i) => {
        queue.add(async () => {
          try {
            const { name, phone, username, loginUrl, token } = account || {};

            const client_id = loginUrl.split("/")[3];

            const { data } = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/templates`,
              {
                searchString: report.templateName,
                sortBy: 0,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  accept: "*/*",
                },
              }
            );

            // console.log("Data from Api: ", data);
            console.log(`Review fetch success for ${username} | ${i}`);
            if (data?.ok) {
              // Getting exact item from an array of found templates
              const template = data?.result?.items?.find(
                (temp) => temp?.elementName === report.templateName
              );

              // console.log("Found template: ", template);

              if (template) {
                result[i] = {
                  submitForReview: report.submitForReview?.includes(username),
                  reviewStatus: template?.status,
                  templateName: report?.templateName,
                  accountName: name,
                  userName: username,
                  phone: phone,
                  createdAt: account?.createdAt,
                };
              }
            }
          } catch (error) {
            console.log(
              `Error while getting template status: ${account?.username}`,
              error
            );
          }
        });
      })
    );

    await queue.onIdle();

    // Remove undefined from result
    const finalResult = result?.filter((item) => Boolean(item));

    res.status(200).json({
      success: true,
      total: finalResult.length,
      failed: result?.length - finalResult?.length,
      data: finalResult,
    });
  } catch (error) {
    console.error("Template status get Error: ", error);
    res.status(500).json({
      message: "An error occurred while getting status.",
      error: error.message,
    });
  }
};

// Get templates details by id

export const templateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await templateModel.findById(templateId);

    // Report
    // const report = await templatesReportsModel.findOne({
    //   templateName: template?.name,
    // });

    // // All usernames (Selected for bulk template create);
    // const usernames = [...report.success, ...report.failed];

    // // Get account from DB to get token of that account.
    // const accounts = await accountModel.find({ username: { $in: usernames } });

    // // Status result
    // const result = [];

    // await asyncForEach(accounts, async (data, index) => {
    //   const { name, phone, username, password, loginUrl, token } = data;

    //   const client_id = loginUrl.split("/")[3];

    //   const { data: responseData } = await axios.post(
    //     `${process.env.WATI_API_URL}/${client_id}/api/v1/templates`,
    //     {
    //       searchString: report.templateName,
    //       sortBy: 0,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         accept: "*/*",
    //       },
    //     }
    //   );

    //   console.log("Template get status response: ", responseData);

    //   if (responseData?.ok) {
    //     console.log("Wend Inside");
    //     // Getting exact item from an array of found templates
    //     const template = responseData?.result?.items?.find(
    //       (temp) => temp?.elementName === report.templateName
    //     );
    //     console.log("Found template: ", template);
    //     if (template) {
    //       result.push({
    //         templateName: report?.templateName,
    //         accountName: data?.name,
    //         userName: data?.username,
    //         submitForReview: report.submitForReview?.includes(data?.username),
    //         isCreated: report?.success?.includes(data?.username),
    //         reviewStatus: template?.status,
    //         phone: data?.phone,
    //       });
    //     }
    //   }

    //   try {
    //   } catch (err) {
    //     console.log("Error while getting template status: ", err);
    //   }
    // });

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {}
};

// Controller to send template for review in accounts accordingly
export const submitTemplateForReview = async (req, res) => {
  try {
    const { template_name } = req.body;
    const { userId } = req;

    if (!template_name)
      return res.json({
        success: false,
        message: "Please enter template_name",
      });

    const template = await templateModel.findOne({
      name: template_name,
      userId,
    });

    let sentSuccess = 0;
    let sentFail = 0;

    if (!template)
      return res.json({
        success: false,
        message: "Template not found with given name.",
      });

    // Getting wati template ids to send for review
    const watiIds = await watiTemplatesIdsModel.find({
      templateName: template_name,
      userId,
    });

    res.json({
      success: true,
      message: `Template sent for review for ${watiIds.length} accounts.`,
    });
    // Create a queue with a concurrency limit (e.g., 5 requests at a time)
    const queue = new PQueue();

    await Promise.all(
      watiIds.map((tempInfo) =>
        queue.add(async () => {
          try {
            const account = await accountModel.findById(tempInfo.accountId);

            const client_id = account?.loginUrl?.split("/")[3];
            const token = account.token;

            const submitResponse = await axios.get(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/submit/${tempInfo.watiTemplateId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!submitResponse?.data?.ok) {
              sentFail++;
              console.error(`Template review failed for ${account.username}`);
            } else {
              // If sent for review success
              console.log(
                `Template review submitted successfully for ${account.username}`
              );
              sentSuccess++;
            }
          } catch (error) {
            console.log("Error while submitting template for review: ", error);
          }
        })
      )
    );
    await queue.onIdle();

    const updatedTemplate = await templateModel.findOneAndUpdate(
      { name: template_name, userId },
      {
        submittedForReview: sentSuccess === watiIds.length,
        reviewSentSuccess: sentSuccess,
        reviewSentFail: sentFail,
      },
      { new: true } // Return the updated document
    );
    console.log("updatedTemplate: ", updatedTemplate);
  } catch (error) {
    console.log("Template Review Submit Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete single templates
export const deleteSingleTemplate = async (req, res) => {
  try {
    const { templateId } = req.body;
    const { userId } = req;

    if (!templateId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide templateId" });
    }

    // Permanently delete the account
    const deletedTemplate = await templateModel.findByIdAndDelete(templateId);

    if (!deletedTemplate) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    const watiTemplateIds = await watiTemplatesIdsModel
      .find({
        templateName: deletedTemplate?.name,
      })
      .populate("accountId");

    const queue = new PQueue({ concurrency: 100 }); // Request to send one time

    // Delete template from all wati accounts
    await Promise.all(
      watiTemplateIds.map((item) => {
        queue.add(async () => {
          try {
            const client_id = item?.accountId?.loginUrl?.split("/")[3];
            const token = item?.accountId.token;

            // Send batch API request
            const response = await axios.delete(
              `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/delete/${item?.watiTemplateId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.log("Template delete error:", error);
          }
        });
      })
    );

    const watiTempIdDeleteFromDB = await watiTemplatesIdsModel.deleteMany({
      templateName: deletedTemplate?.name,
      userId,
    });

    const templateReportDelete = await templatesReportsModel.deleteMany({
      templateName: deletedTemplate?.name,
      userId,
    });

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.log("Template delete Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
