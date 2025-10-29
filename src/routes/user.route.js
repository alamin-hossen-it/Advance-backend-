import express from "express"
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = express.Router()
//Users related routes
userRouter.post('/register', upload.fields([{name:"avatar", maxCount:1},{name:"coverImage", maxCount:1}]), registerUser)

export default userRouter;