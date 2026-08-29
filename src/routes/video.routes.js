import {
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();
// Get all videos
router.get("/", getAllVideos);


// Get one video
router.get("/:videoId", getVideoById);


// Publish/upload a video
router.post(
    "/",
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishVideo
);


// Update video
router.patch(
    "/:videoId",
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo
);


// Delete video
router.delete(
    "/:videoId",
    verifyJWT,
    deleteVideo
);


// Publish/unpublish video
router.patch(
    "/:videoId/toggle-publish",
    verifyJWT,
    togglePublishStatus
);


export default router;