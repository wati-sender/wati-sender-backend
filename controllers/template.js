import axios from "axios";
import accountModel from "../models/account.model.js";
import PQueue from "p-queue";
import templatesReportsModel from "../models/templatesReports.model.js";

// For creating single template
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
    const token = req.headers.authorization;
    const client_id = req.params.client_id;

    if (!token || !client_id) {
      return res
        .status(401)
        .json({ error: "Authorization token or client id is missing" });
    }
    const response = await axios.get(
      `${process.env.WATI_API_URL}/${client_id}/api/v1/getMessageTemplates?pageSize=100&pageNumber=1`,
      {
        headers: {
          accept: "*/*",
          Authorization: token,
        },
      }
    );

    if (response?.data?.result !== "success") {
      return res.status(500).send("Failed to get templates");
    }

    return res.status(200).json({
      total: response?.data?.messageTemplates?.length,
      templates: response?.data?.messageTemplates,
    });
  } catch (error) {
    console.log("Get All Templates Error: ", error);
    res.status(500).json({ error: error });
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
      return res
        .status(400)
        .send("End account index must be greater than start index");

    const allAccounts = await accountModel.find().sort({ createdAt: -1 });
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
    const queue = new PQueue({ concurrency: 5 });

    // Counters for success, failures, and review
    const createSuccessUserNames = [];
    const createFailedUserNames = [];
    const reviewSuccessTempUsernames = [];
    const reviewFailUserNames = [];

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

    await Promise.all(
      accounts.map((account) =>
        queue.add(async () => {
          try {
            const client_id = account?.loginUrl?.split("/")[3];
            const token = account.token;

            if (token) {
              // If login success
              const response = await createTemplateBulk(
                token,
                templateData,
                client_id
              );
              console.log("REsponse: ", response);
              if (response.success) {
                // If template create success
                createSuccessUserNames.push(account.username);
                console.log(
                  `Template created successfully for ${account.username}`
                );

                // Request for review
                const submitResponse = await axios.get(
                  `${process.env.WATI_API_URL}/${client_id}/api/v1/templates/submit/${response?.data?.result?.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                console.log("Review Submit Response: ", submitResponse);
                // If review submission fail
                if (!submitResponse?.data?.ok) {
                  reviewFailUserNames.push(account.username);
                  console.error(
                    `Template review failed for ${account.username}`
                  );
                } else {
                  // If sent for review success
                  console.log(
                    `Template review submitted successfully for ${account.username}`
                  );
                  reviewSuccessTempUsernames.push(account.username);
                }
              } else {
                // If template create fails
                createFailedUserNames.push(account.username);
                reviewFailUserNames.push(account.username);
                console.error(
                  `Failed to create template for ${account.username}: ${response.error}`
                );
              }
            } else {
              // If Login fail
              createFailedUserNames.push(account.username);
              reviewFailUserNames.push(account.username);
              console.error(
                `Skipping template creation for ${account.username} due to login failure.`
              );
            }
          } catch (error) {
            console.log("Error: ", error);
            createFailedUserNames.push(account.username);
            reviewFailUserNames.push(account.username);
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
      totalAccounts: accounts?.length,
      success: createSuccessUserNames,
      failed: createFailedUserNames,
      submitForReview: reviewSuccessTempUsernames,
      reviewSubmitFailed: reviewFailUserNames,
    });

    // Save template report
    await templateCreateBulkReport.save();

    console.log("All accounts processed.");
    console.log(
      `Success: ${createSuccessUserNames.length}, Failures: ${createFailedUserNames.length}, Review Failures: ${reviewFailUserNames.length}, Review Success: ${reviewSuccessTempUsernames.length} `
    );
  } catch (error) {
    console.error("Bulk Template Create Error: ", error);
    res.status(500).json({
      message: "An error occurred while processing accounts.",
      error: error.message,
    });
  }
};
