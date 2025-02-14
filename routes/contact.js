import express from 'express';
import { addBulkContacts, addSingleContact, getAllContacts } from '../controllers/contact.js';

const ContactRoutes = express.Router();

ContactRoutes.post("/add/single",addSingleContact);
ContactRoutes.post("/add/bulk",addBulkContacts);
ContactRoutes.get("/all",getAllContacts);
export default ContactRoutes;