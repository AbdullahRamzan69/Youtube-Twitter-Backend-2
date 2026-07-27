// this file is for starting the app 
// its the entry point


import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1); //If MongoDB can't connect, there's usually no point in running your server because requests that need the database will fail. Exiting immediately is the standard behavior for most Express + MongoDB applications.
  });