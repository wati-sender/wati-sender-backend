import express from 'express';
import { sendBulkMessages } from '../controllers/message.js';

const MessagesRoutes = express.Router();

MessagesRoutes.post("/send/bulk",sendBulkMessages);
export default MessagesRoutes;