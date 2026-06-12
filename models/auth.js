const mongoose = require("mongoose")

const { Schema, model } = mongoose;

const schema = new Schema({
    uid: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    password: { type: String, required: true, },
    role: { type: String, enum: ["superAdmin", "customer"], default: "customer" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

module.exports = model("users", schema);