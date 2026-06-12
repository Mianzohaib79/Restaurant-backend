const mongoose = require("mongoose");

const { MONGODB_PASSWORD, MONGODB_USERNAME } = process.env;

const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@cluster0.wghu6qx.mongodb.net/?appName=Cluster0`);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
};

module.exports = connectDB;