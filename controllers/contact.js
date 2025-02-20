import { isValidObjectId } from "mongoose";
import contactModel from "../models/contact.model.js";
import { asyncForEach } from "../utils/common.js";

export const addSingleContact = async (req, res) => {
  try {
    const { name, phone, countryCode = "91" } = req.body;
    console.log("Phone", phone);
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const contactExist = await contactModel.findOne({ phone });

    if (contactExist) {
      return res.status(400).json({ message: "Contact already exist" });
    }

    const newContact = new contactModel({
      name,
      phone,
      countryCode,
    });

    await newContact.save();
    res.status(201).json({ message: "Contact added successfully" });
  } catch (error) {
    console.log("Add Single Contact Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addBulkContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    const inserted = [];
    const failed = [];
    const exist = [];

    await asyncForEach(contacts, async (data, index) => {
      const { name, phone, countryCode = "91" } = data;

      const existingContact = await contactModel.findOne({ phone });

      //   If not exist add new contact
      if (!existingContact) {
        const newContact = new contactModel({
          name,
          phone,
          countryCode,
        });

        await newContact.save();
        if (!newContact) {
          failed.push(index);
        } else {
          inserted.push(index);
        }
      } else {
        // If exist don't do anything
        exist.push(index);
      }
    });

    return res.status(200).json({
      status: true,
      message: "Bulk contacts added successfully",
      inserted: inserted.length,
      exist: exist.length,
      failed: failed.length,
    });
  } catch (error) {
    console.log("Bulk Add Contacts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const allContacts = await contactModel.find();

    return res
      .status(200)
      .json({ total: allContacts.length, contacts: allContacts });
  } catch (error) {
    console.log("Get All Contacts Error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete single contact
export const deleteSingleContact = async (req, res) => {
  try {
    const { contact_id } = req.body;

    if (!isValidObjectId(contact_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid contact_id" });
    }

    // Permanently delete the account
    const deletedContact = await contactModel.findByIdAndDelete(contact_id);

    if (!deletedContact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Single contact delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message,
    });
  }
};

// Delete multiple contacts
export const deleteMultipleContacts = async (req, res) => {
  try {
    const { contact_ids } = req.body; // Expecting an array of contact_ids

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid contact_ids array",
      });
    }

    // Permanently delete all accounts with matching userIds
    const result = await contactModel.deleteMany({ _id: { $in: contact_ids } });
    console.log("_result", result);
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No contacts found to delete" });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} contacts are deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Multiple contacts delete error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contacts",
      error: error.message,
    });
  }
};
