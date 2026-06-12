const mongoose = require("mongoose")

const { Schema, model } = mongoose;

const schema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    id: { type: String, required: true, trim: true, unique: true }
}, { timestamps: true });

module.exports = model("categories", schema);