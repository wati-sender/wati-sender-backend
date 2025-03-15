import express from "express";
import { deleteMedia, getAllMedia, uploadMedia } from "../controllers/media.js";
import multer from "multer";

const upload = multer();

const MediaRoutes = express.Router();

MediaRoutes.post("/upload", upload.single('file'), uploadMedia);
MediaRoutes.get("/all", getAllMedia);
MediaRoutes.post("/delete", deleteMedia);
export default MediaRoutes;
