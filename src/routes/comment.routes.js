import { Router } from 'express';
import {
    addComment,
    addTweetComment,
    deleteComment,
    getAllComments,
    getTweetComments,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/tweet/:tweetId")
    .get(verifyJWTOptional, getTweetComments)
    .post(verifyJWT, addTweetComment);

router.route("/:videoId")
    .get(verifyJWTOptional, getAllComments)
    .post(verifyJWT, addComment);

router.route("/c/:commentId")
    .delete(verifyJWT, deleteComment)
    .patch(verifyJWT, updateComment);

export default router;
