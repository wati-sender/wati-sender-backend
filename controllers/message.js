import PQueue from "p-queue";
import axios from "axios";
import accountModel from "../models/account.model.js";

export const sendBulkMessages = async (req, res) => {
  try {
    const {
      template_name,
      account_ids,
      broadcast_name,
      change_account_after_messages = 1000,
      receivers,
    } = req.body;

    if (!template_name || !broadcast_name)
      return res
        .status(400)
        .send("Template name and Broadcast name are required");
    if (
      !account_ids ||
      account_ids.length === 0 ||
      !receivers ||
      receivers?.length === 0
    )
      return res.status(400).send("Account ids and receivers are required");

    const allAccounts = await accountModel.find({ _id: { $in: account_ids } }); // Accounts filtered by account ids
    console.log(
      "Selected Accounts: ",
      allAccounts?.map((acc) => acc?.username)
    );
    console.log("Total Receivers: ", receivers?.length);

    if (!allAccounts.length) {
      return res.status(400).json({ message: "No accounts available" });
    }

    const queue = new PQueue({ concurrency: 1 }); // Only 1 batch sent at a time
    let BATCH_SIZE = receivers?.length / allAccounts?.length; // Number of messages per batch
    BATCH_SIZE = BATCH_SIZE >= 1 ? Math.ceil(BATCH_SIZE) : 1;
    let successCount = 0;
    let failCount = 0;
    let totalMessagesSent = 0;
    let currentAccountIndex = 0;
    let messagesCount = 0;
    let currentToken;

    // Helper: Split contacts into batches
    const chunkArray = (array, size) =>
      array.reduce((chunks, _, i) => {
        if (i % size === 0) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      }, []);

    // Contact batches
    const contactBatches = chunkArray(receivers, BATCH_SIZE);



    console.log("Starting Bulk Message Queue...");
    console.log("Batch Size: ", BATCH_SIZE);
    console.log("Receivers: ", receivers?.length);
    console.log("Accounts: ", allAccounts?.length);
    console.log("Contact Batches: ", contactBatches);

    return;
    // Process each batch
    await Promise.all(
      contactBatches.map((batch) =>
        queue.add(async () => {
          try {
            const currentAccount = allAccounts[currentAccountIndex];
            const client_id = currentAccount?.loginUrl?.split("/")[3];

            // If accounts not found throw an error
            if (!currentAccount) {
              throw new Error("No account available for processing");
            }

            // If token is not there login again with new account
            if (!currentToken) {
              currentToken = currentAccount.token;
            }

            // Prepare payload for the batch
            const payload = {
              template_name: template_name, // Ensure this is passed in the request
              broadcast_name: broadcast_name,
              receivers: batch.map((contact) => ({
                whatsappNumber: contact.whatsappNumber, // Update based on your schema
                customParams: contact.customParams || [], // Pass any dynamic parameters
              })),
            };

            // Send batch API request
            const response = await axios.post(
              `${process.env.WATI_API_URL}/${client_id}/api/v2/sendTemplateMessages`,
              payload,
              { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            console.log(
              `Batch sent with ${batch.length} messages using account ${currentAccount?.username}`
            );
            console.log("Response: ", response?.data);

            if (response?.data?.result) {
              successCount += batch.length;
            } else {
              failCount += batch.length;
            }
            messagesCount += batch.length;
            totalMessagesSent += batch.length;

            // Check if the account has reached its 1000-message limit
            if (messagesCount >= BATCH_SIZE) {
              currentAccountIndex++;
              messagesCount = 0;
              currentToken = null;

              if (currentAccountIndex >= allAccounts.length) {
                throw new Error(
                  "All accounts exhausted. No more accounts available."
                );
              }
            }
          } catch (error) {
            if (!error.message.includes("accounts exhausted")) {
              failCount += batch.length; // Assume the whole batch failed
            } else {
              console.error(`Error sending batch:`, error.message);
            }
          }
        })
      )
    );

    await queue.onIdle();

    console.log({
      message: "Bulk message processing completed.",
      successCount,
      failCount,
      totalMessagesSent,
    });
    console.log(
      `Results: Success: ${successCount}, Failures: ${failCount}, Total Messages: ${totalMessagesSent}`
    );
  } catch (error) {
    console.error("Error in bulk message sending:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
