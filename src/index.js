import dotenv from "dotenv";
import dataBaseConnect from "./db/database.js";
dotenv.config({
    path: "./.env"
})


dataBaseConnect()