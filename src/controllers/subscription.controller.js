import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    // 1. Get channel ID from URL
    const { channelId } = req.params;

    // 2. Prevent user from subscribing to themselves
    if (channelId === req.user._id.toString()) {
        throw new apiError(400, "You cannot subscribe to yourself");
    }

    // 3. Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        // 4. If subscribed, remove subscription
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new apiResponse(200, {}, "Unsubscribed successfully"));
    } else {
        // 5. If not subscribed, add subscription
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(201).json(new apiResponse(201, newSubscription, "Subscribed successfully"));
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // 1. Get channel ID from URL
    const { channelId } = req.params;

    // 2. Find subscriptions where channel is the channelId
    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username fullName avatar");

    // 3. Send response
    return res.status(200).json(new apiResponse(200, subscribers, "Subscribers fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    // 1. Get subscriber ID from URL
    const { subscriberId } = req.params;

    // 2. Find subscriptions where subscriber is the subscriberId
    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullName avatar");

    // 3. Send response
    return res.status(200).json(new apiResponse(200, channels, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
