import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getAllTweets,
    getTweetById,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/")
    .get(verifyJWTOptional, getAllTweets)
    .post(verifyJWT, upload.single("image"), createTweet);

router.route("/user/:userId").get(verifyJWTOptional, getUserTweets);
router.route("/:tweetId")
    .get(verifyJWTOptional, getTweetById)
    .patch(verifyJWT, updateTweet)
    .delete(verifyJWT, deleteTweet);

export default router;
