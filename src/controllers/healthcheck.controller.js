import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

const healthcheck = asyncHandler(async (req, res) => {
    // 1. Send an OK response to indicate server is running
    return res.status(200).json(new apiResponse(200, { status: "OK" }, "System is running healthy"));
});

export {
    healthcheck
};
