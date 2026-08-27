import { publishVideo } from "../controllers/video.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import router from "./user.routes";

router.route("/publish-Video").post(
    verifyJWT,
    upload.fields(
        [
            {
             name: videoFile,
             maxCount:1
            },
            {
             name: thumbnail,
             maxCount:1

            }
        ]
    ),
    publishVideo
)