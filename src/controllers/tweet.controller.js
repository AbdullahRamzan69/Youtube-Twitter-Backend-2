import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
    // 1. Get tweet content from request body
    const { content } = req.body;

    if (!content?.trim()) {
        throw new apiError(400, "Content is required");
    }

    // 2. Create the tweet
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    // 3. Send response
    return res.status(201).json(
        new apiResponse(201, tweet, "Tweet created successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    // 1. Get user ID from URL
    const { userId } = req.params;

    // 2. Find all tweets by this user
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    // 3. Send response
    return res.status(200).json(
        new apiResponse(200, tweets, "Tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    // 1. Get tweet ID from URL and new content from body
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new apiError(400, "Content is required");
    }

    // 2. Find tweet
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Tweet not found");
    }

    // 3. Check ownership
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot update this tweet");
    }

    // 4. Update and save
    tweet.content = content;
    await tweet.save();

    // 5. Send response
    return res.status(200).json(
        new apiResponse(200, tweet, "Tweet updated successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    // 1. Get tweet ID from URL
    const { tweetId } = req.params;

    // 2. Find tweet
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Tweet not found");
    }

    // 3. Check ownership
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot delete this tweet");
    }

    // 4. Delete from database
    await Tweet.findByIdAndDelete(tweetId);

    // 5. Send response
    return res.status(200).json(
        new apiResponse(200, {}, "Tweet deleted successfully")
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};
