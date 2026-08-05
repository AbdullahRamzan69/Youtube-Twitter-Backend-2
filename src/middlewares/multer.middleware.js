import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, // storage:storage, 
}) 

// why needed

/*Because Express cannot handle file uploads by itself.

When a user uploads an image or video, the request is sent as multipart/form-data, not JSON.   */