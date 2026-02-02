

import mongoose from "mongoose";



const connectDB= async()=>{

    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/car-rental`)
       console.log("data base is connected ");
    } catch (error) {
        console.log(error.message);
    }
}

export default connectDB;