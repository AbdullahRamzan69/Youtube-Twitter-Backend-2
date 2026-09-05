import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { fileUploadCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const MAX_CONTENT_LENGTH = 5000;

const enrichPosts = async (posts, userId) => {
    if (!posts.length) return [];

    const ids = posts.map((post) => post._id);

    const [likeCounts, commentCounts, userLikes] = await Promise.all([
        Like.aggregate([
            { $match: { tweet: { $in: ids } } },
            { $group: { _id: "$tweet", count: { $sum: 1 } } }
        ]),
        Comment.aggregate([
            { $match: { tweet: { $in: ids } } },
            { $group: { _id: "$tweet", count: { $sum: 1 } } }
        ]),
        userId
            ? Like.find({ tweet: { $in: ids }, likedBy: userId }).select("tweet")
            : Promise.resolve([])
    ]);

    const likesMap = new Map(likeCounts.map((item) => [item._id.toString(), item.count]));
    const commentsMap = new Map(commentCounts.map((item) => [item._id.toString(), item.count]));
    const likedSet = new Set(userLikes.map((like) => like.tweet.toString()));

    return posts.map((post) => {
        const obj = typeof post.toObject === "function" ? post.toObject() : post;
        const id = obj._id.toString();
        return {
            ...obj,
            likesCount: likesMap.get(id) || 0,
            commentsCount: commentsMap.get(id) || 0,
            isLiked: likedSet.has(id)
        };
    });
};

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const imageLocalPath = req.file?.path;
    const trimmedContent = content?.trim() || "";

    if (!trimmedContent && !imageLocalPath) {
        throw new apiError(400, "Post text or an image is required");
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
        throw new apiError(400, `Content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
    }

    let image = "";
    if (imageLocalPath) {
        const uploaded = await fileUploadCloudinary(imageLocalPath);
        if (!uploaded?.url) {
            throw new apiError(400, "Image upload failed");
        }
        image = uploaded.url;
    }

    const createdTweet = await Tweet.create({
        content: trimmedContent,
        image,
        owner: req.user._id
    });

    const tweet = await Tweet.findById(createdTweet._id).populate("owner", "username avatar fullName");

    return res.status(201).json(
        new apiResponse(
            201,
            {
                ...tweet.toObject(),
                likesCount: 0,
                commentsCount: 0,
                isLiked: false
            },
            "Community post created successfully"
        )
    );
});

const getAllTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.find()
        .populate("owner", "username avatar fullName")
        .sort({ createdAt: -1 });

    const posts = await enrichPosts(tweets, req.user?._id);

    return res.status(200).json(
        new apiResponse(200, posts, "Community posts fetched successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400, "Invalid user id");
    }

    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username avatar fullName")
        .sort({ createdAt: -1 });

    const posts = await enrichPosts(tweets, req.user?._id);

    return res.status(200).json(
        new apiResponse(200, posts, "Channel community posts fetched successfully")
    );
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid post id");
    }

    const tweet = await Tweet.findById(tweetId).populate("owner", "username avatar fullName");

    if (!tweet) {
        throw new apiError(404, "Community post not found");
    }

    const [post] = await enrichPosts([tweet], req.user?._id);

    return res.status(200).json(
        new apiResponse(200, post, "Community post fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const trimmedContent = content?.trim() || "";

    if (!trimmedContent) {
        throw new apiError(400, "Content is required");
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
        throw new apiError(400, `Content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Community post not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot update this post");
    }

    tweet.content = trimmedContent;
    await tweet.save();

    const updatedTweet = await Tweet.findById(tweetId).populate("owner", "username avatar fullName");
    const [post] = await enrichPosts([updatedTweet], req.user._id);

    return res.status(200).json(
        new apiResponse(200, post, "Community post updated successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Community post not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot delete this post");
    }

    const commentIds = await Comment.find({ tweet: tweetId }).distinct("_id");

    await Promise.all([
        Tweet.findByIdAndDelete(tweetId),
        Like.deleteMany({ tweet: tweetId }),
        Comment.deleteMany({ tweet: tweetId }),
        commentIds.length ? Like.deleteMany({ comment: { $in: commentIds } }) : Promise.resolve()
    ]);

    return res.status(200).json(
        new apiResponse(200, {}, "Community post deleted successfully")
    );
});

export {
    createTweet,
    getAllTweets,
    getUserTweets,
    getTweetById,
    updateTweet,
    deleteTweet
};
