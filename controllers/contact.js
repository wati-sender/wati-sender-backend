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
