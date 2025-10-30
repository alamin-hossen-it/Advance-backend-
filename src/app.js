import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
import userRouter from "./routes/user.route.js";
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extended:true, limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())
//static routers decleration
app.use("/api/v1/users", userRouter)

// Custom Error Handler
app.use((err, req, res, next) => {
    console.error(err); // server console এ log
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export default app;