import { isValidObjectId } from "mongoose";
import cloudinary from "../cloudinary.js";
import mediaModel from "../models/media.model.js";

// Upload media to cloudinary
export const uploadMedia = async (req, res) => {
  try {
    const { file, userId } = req;

    // Convert buffer to base64 string and prepend the appropriate mime type
    const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;

    // Upload to Cloudinary
    const cloudinary_resp = await cloudinary.uploader.upload(base64String, {
      folder: "/watisender",
      resource_type: file.mimetype?.startsWith("video") ? "video" : "image",
    });

    const newMedia = new mediaModel({
      url: cloudinary_resp?.url,
      resource_type: cloudinary_resp?.resource_type,
      public_id: cloudinary_resp?.public_id,
      userId,
    });

    await newMedia.save();

    console.log("CLOUDINARY_RESP: ", cloudinary_resp);
    res.status(200).json({
      success: true,
      message: "Media uploaded successfully",
      data: {
        url: cloudinary_resp?.url,
        resource_type: cloudinary_resp?.resource_type,
      },
    });
  } catch (error) {
    console.log("Media upload error: ", error);
    res.status(500).json({ success: false, message: "Upload failed", error });
  }
};

// Get all media
export const getAllMedia = async (req, res) => {
  try {
    const { userId } = req;
    const media = await mediaModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: media });
  } catch (error) {
    console.log("Media get error: ", error);
    res.status(500).json({ message: "Failed to get media", error });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { media_id } = req.body;
    const { userId } = req;

    if (!isValidObjectId(media_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Media ID is not valid" });
    }
    // Permanently delete the account
    const media = await mediaModel.findOne({ _id: media_id, userId });

    if (!media) {
      return res
        .status(400)
        .json({ success: false, message: "Media not found" });
    }

    const cloudinary_resp = await cloudinary.uploader.destroy(media?.public_id);
    console.log("DELETE RESPONSE: ", cloudinary_resp);

    // Check if deletion was successful
    if (cloudinary_resp.result === "ok") {
      await mediaModel.findByIdAndDelete(media_id);
      res.status(200).json({
        success: true,
        message: "Media deleted successfully",
        data: cloudinary_resp,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete media",
        error: cloudinary_resp,
      });
    }
  } catch (error) {
    console.log("Media delete error: ", error);
    res.status(500).json({ message: "Failed to delete media", error });
  }
};
