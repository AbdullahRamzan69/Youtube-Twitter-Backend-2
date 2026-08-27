import { Video } from "../models/video.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Aggregate  } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const pipeline = [];

    // Search by title/description
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // Filter by owner
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Sort
    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    });

    const aggregate = Video.aggregate(pipeline);

    const videos = await Video.mongooseAggregatePaginate(aggregate, {
        page: Number(page),
        limit: Number(limit)
    });

    return res.status(200).json(
        new apiResponse(200, videos, "Videos fetched successfully")
    );
});

const getVideoById = asyncHandler(async(req,res)=>{

    const{videoId} = req.params

    if(!videoId){
        throw new apiError(401,"NO VIDEO FOUND")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new apiError(404, "video not available")
    }

    return res
    .status(200)
    .json(
       new apiResponse(
        200,
        video,
        "video fetched successfully"
       )
        
    )
})

const publishVideo = asyncHandler(async(req,res)=>{
    const {title,description,} = req.body // get the uploaded title,desc from body
    const {thumbnail,videoFile} = req.files // get the uploaded files from multer

    
    if (!title || !description) {
        throw new apiError(400,"title & description are required!")
    }
    if (!thumbnail || !videoFile) {
        throw new apiError(400,"thumbnail & videoFile are required!")
    }

    // 4. Get the local file paths
    const videoLocalPath = videoFile[0].path;
    const thumbnailLocalPath = thumbnail[0].path;

    // 5. Upload files to Cloudinary
    const video = await fileUploadCloudinary(videoLocalPath);
    const thumbnailUpload = await fileUploadCloudinary(thumbnailLocalPath);

    // 6. Check if Cloudinary uploads succeeded
    if (!video) {
        throw new apiError(500, "Video upload failed");
    }

    if (!thumbnailUpload) {
        throw new apiError(500, "Thumbnail upload failed");
    }

    // 7. Get the logged-in user's ID
    const owner = req.user._id;

    // 8. Create video document
    const createdVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnailUpload.url,
        owner
    });

    // 9. Check if video was created
    if (!createdVideo) {
        throw new apiError(500, "Video could not be created");
    }

    // 10. Send response
    return res.status(201).json(
        new apiResponse(
            201,
            createdVideo,
            "Video published successfully"
        )
    );
});

const updateVideo = asyncHandler(async (req, res) => {

    // 1. Get video ID from URL
    const { videoId } = req.params;

    // 2. Get new data from request body
    const { title, description } = req.body;

    // 3. Check video ID
    if (!videoId) {
        throw new apiError(400, "Video ID is required");
    }

    // 4. Find the video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // 5. Check if logged-in user owns the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not the owner of this video");
    }

    // 6. Update fields
    if (title) {
        video.title = title;
    }

    if (description) {
        video.description = description;
    }

    // 7. Check if a new thumbnail was uploaded
    if (req.file) {

        const thumbnailLocalPath = req.file.path;

        const thumbnail = await fileUploadCloudinary(
            thumbnailLocalPath
        );

        if (!thumbnail) {
            throw new apiError(500, "Thumbnail upload failed");
        }

        video.thumbnail = thumbnail.url;
    }

    // 8. Save updated video
    await video.save();

    // 9. Send response
    return res.status(200).json(
        new apiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!videoId) {
        throw new apiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // Check if logged-in user owns the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not the owner of this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new apiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!videoId) {
        throw new apiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(404, "Video not found");
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not the owner of this video");
    }

    // Toggle the current status
    video.isPublished = !video.isPublished;

    await video.save();

    return res.status(200).json(
        new apiResponse(
            200,
            video,
            video.isPublished
                ? "Video published successfully"
                : "Video unpublished successfully"
        )
    );
});

export{
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}