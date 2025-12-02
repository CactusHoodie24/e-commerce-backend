import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import app from "./src/app.js";

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => console.log(err));
