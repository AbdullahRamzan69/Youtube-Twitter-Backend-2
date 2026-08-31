import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    // 1. Get name and description from body
    const { name, description } = req.body;

    if (!name?.trim()) {
        throw new apiError(400, "Name is required");
    }

    // 2. Create playlist
    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id,
        videos: []
    });

    // 3. Send response
    return res.status(201).json(new apiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    // 1. Get user ID from URL
    const { userId } = req.params;

    // 2. Find playlists by user
    const playlists = await Playlist.find({ owner: userId });

    // 3. Send response
    return res.status(200).json(new apiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    // 1. Get playlist ID from URL
    const { playlistId } = req.params;

    // 2. Find playlist and populate videos
    const playlist = await Playlist.findById(playlistId).populate("videos");

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    // 3. Send response
    return res.status(200).json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // 1. Get playlist ID and video ID from URL
    const { playlistId, videoId } = req.params;

    // 2. Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    // 3. Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You can only add videos to your own playlist");
    }

    // 4. Add video if not already in playlist
    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId);
        await playlist.save();
    }

    // 5. Send response
    return res.status(200).json(new apiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // 1. Get playlist ID and video ID from URL
    const { playlistId, videoId } = req.params;

    // 2. Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    // 3. Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You can only remove videos from your own playlist");
    }

    // 4. Remove video
    playlist.videos = playlist.videos.filter(vid => vid.toString() !== videoId);
    await playlist.save();

    // 5. Send response
    return res.status(200).json(new apiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    // 1. Get playlist ID from URL
    const { playlistId } = req.params;

    // 2. Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    // 3. Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You can only delete your own playlist");
    }

    // 4. Delete playlist
    await Playlist.findByIdAndDelete(playlistId);

    // 5. Send response
    return res.status(200).json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    // 1. Get playlist ID from URL
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // 2. Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    // 3. Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You can only update your own playlist");
    }

    // 4. Update fields
    if (name) playlist.name = name;
    if (description !== undefined) playlist.description = description;

    await playlist.save();

    // 5. Send response
    return res.status(200).json(new apiResponse(200, playlist, "Playlist updated successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
