import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    // 1. Get video ID from URL
    const { videoId } = req.params;

    // 2. Check if like already exists for this video and user
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // 3. If exists, remove it (unlike)
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new apiResponse(200, {}, "Video unliked successfully"));
    } else {
        // 4. If not exists, create it (like)
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        return res.status(201).json(new apiResponse(201, newLike, "Video liked successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    // 1. Get comment ID from URL
    const { commentId } = req.params;

    // 2. Check if like already exists for this comment and user
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // 3. If exists, remove it (unlike)
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new apiResponse(200, {}, "Comment unliked successfully"));
    } else {
        // 4. If not exists, create it (like)
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });
        return res.status(201).json(new apiResponse(201, newLike, "Comment liked successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    // 1. Get tweet ID from URL
    const { tweetId } = req.params;

    // 2. Check if like already exists for this tweet and user
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (existingLike) {
        // 3. If exists, remove it (unlike)
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new apiResponse(200, {}, "Tweet unliked successfully"));
    } else {
        // 4. If not exists, create it (like)
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });
        return res.status(201).json(new apiResponse(201, newLike, "Tweet liked successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // 1. Find all likes by the current user where video field exists
    const likes = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    }).populate("video");

    // 2. Extract just the video objects
    const likedVideos = likes.map(like => like.video);

    // 3. Send response
    return res.status(200).json(
        new apiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};
