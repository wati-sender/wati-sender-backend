import express from "express";
import { deleteMedia, getAllMedia, uploadMedia } from "../controllers/media.js";
import multer from "multer";
import { protectRequest } from "../middlewares/auth.middleware.js";

const upload = multer();

const MediaRoutes = express.Router();

MediaRoutes.post("/upload", protectRequest, upload.single("file"), uploadMedia);
MediaRoutes.get("/all", protectRequest, getAllMedia);
MediaRoutes.post("/delete", protectRequest, deleteMedia);
export default MediaRoutes;
