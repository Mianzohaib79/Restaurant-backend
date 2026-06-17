const mongoose = require("mongoose");

const { MONGODB_PASSWORD, MONGODB_USERNAME, MONGODB_URI } = process.env;

const connectDB = async () => {
    try {
        const uri = MONGODB_URI || `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0.wghu6qx.mongodb.net/?appName=Cluster0`;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("MongoDB Connection Error: ", error);
    }
};

module.exports = connectDB;