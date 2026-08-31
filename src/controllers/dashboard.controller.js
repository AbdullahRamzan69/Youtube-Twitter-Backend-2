import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const getChannelStats = asyncHandler(async (req, res) => {
    // 1. Get channel ID (logged in user)
    const userId = req.user._id;

    // 2. Total views & Total videos
    const videoStats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // 3. Total subscribers
    const subscriberCount = await Subscription.countDocuments({ channel: userId });

    // 4. Total likes on user's videos
    // First find user's videos
    const videos = await Video.find({ owner: userId }).select("_id");
    const videoIds = videos.map(video => video._id);
    // Count likes on those videos
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    // 5. Structure data
    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers: subscriberCount,
        totalLikes
    };

    // 6. Send response
    return res.status(200).json(new apiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // 1. Get user ID
    const userId = req.user._id;

    // 2. Find all videos by this user
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    // 3. Send response
    return res.status(200).json(new apiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};
