import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

 const dataBaseConnect = async ()=>{
try {
  const connectionInstanse = await  mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
  console.log(`\n Database is connected successfully!! DB HOST: ${connectionInstanse.connection.host}`)
} catch (error) {
    console.error("Error while connecting database", error);
    process.exit(1)
    
}
}

export default dataBaseConnect;