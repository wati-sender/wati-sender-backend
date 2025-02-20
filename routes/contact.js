import express from "express";
import {
  addBulkContacts,
  addSingleContact,
  deleteMultipleContacts,
  deleteSingleContact,
  getAllContacts,
} from "../controllers/contact.js";

const ContactRoutes = express.Router();

ContactRoutes.post("/add/single", addSingleContact);
ContactRoutes.post("/add/bulk", addBulkContacts);
ContactRoutes.get("/all", getAllContacts);
ContactRoutes.post("/delete/single", deleteSingleContact);
ContactRoutes.post("/delete/multiple", deleteMultipleContacts);
export default ContactRoutes;
