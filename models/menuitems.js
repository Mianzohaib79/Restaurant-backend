const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const menuItemsSchema = new Schema({
    itemId: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    itemCategory: { type: String, required: true },
    itemPrice: { type: Number, required: true },
    status: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
    isPopular: { type: Boolean, default: false },
    imageURL: { type: String, required: true },
    imagePublicId: { type: String, required: true },
}, { timestamps: true });

module.exports = model('menuitems', menuItemsSchema);