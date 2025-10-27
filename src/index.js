import dotenv from "dotenv";
import dataBaseConnect from "./db/database.js";
import app from "./app.js";


dotenv.config()
dataBaseConnect().then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`Server is running at http://localhost:${process.env.PORT}`)
    })
}).catch((err)=>{ 
    console.log("MongoDB Connection is faield!1",err)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});