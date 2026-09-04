import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const addComment = asyncHandler(async (req, res) => {
    // Get video ID from URL
    const { videoId } = req.params;

    // Get comment text from request body
    const { content } = req.body;

    // Check comment
    if (!content?.trim()) {
        throw new apiError(400, "Comment is required");
    }

    // Check video exists
    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // Create comment
    const createdComment = await Comment.create({
        content,
        video: videoId,
        user: req.user._id
    });

    const comment = await Comment.findById(createdComment._id).populate("user", "username avatar fullName");

    return res.status(201).json(
        new apiResponse(
            201,
            {
                ...comment.toObject(),
                likesCount: 0,
                isLiked: false
            },
            "Comment added successfully"
        )
    );
});

const getAllComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Get video ID from URL

    const comments = await Comment.find({ video: videoId }) // Find comments belonging to this video
        .populate("user", "username avatar fullName") // Get user information
        .sort({ createdAt: -1 }); // Newest comments first

    const commentsWithLikes = await Promise.all(
        comments.map(async (comment) => {
            const likesCount = await Like.countDocuments({ comment: comment._id });
            let isLiked = false;
            if (req.user) {
                const userLike = await Like.findOne({
                    comment: comment._id,
                    likedBy: req.user._id
                });
                isLiked = !!userLike;
            }
            return {
                ...comment.toObject(),
                likesCount,
                isLiked
            };
        })
    );

    return res.status(200).json(
        new apiResponse(
            200,
            commentsWithLikes,
            "Comments fetched successfully"
        )
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Get comment ID from URL
    const { content } = req.body; // Get new comment text

    if (!content?.trim()) {
        throw new apiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId); // Find the comment

    if (!comment) {
        throw new apiError(404, "Comment not found");
    }

    if (comment.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot update this comment"); // Only owner can update
    }

    comment.content = content; // Replace old content with new content

    await comment.save(); // Save changes to MongoDB

    const updatedComment = await Comment.findById(commentId).populate("user", "username avatar fullName");

    return res.status(200).json(
        new apiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Get comment ID from URL

    const comment = await Comment.findById(commentId); // Find the comment

    if (!comment) {
        throw new apiError(404, "Comment not found");
    }

    if (comment.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot delete this comment"); // Only owner can delete
    }

    await Comment.findByIdAndDelete(commentId); // Delete comment from MongoDB
    await Like.deleteMany({ comment: commentId }); // Clean up associated comment likes

    return res.status(200).json(
        new apiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    );
});

export { 
    addComment,
    getAllComments,
    updateComment,
    deleteComment,
};