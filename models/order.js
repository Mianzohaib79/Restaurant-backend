const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const schema = new Schema({
    uid: { type: String, required: true },
    orderId: { type: String, required: true },
    items: [{
        menuItemId: { type: Schema.Types.ObjectId, ref: 'menuItems', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        name: { type: String, required: true }
    }],
    totalAmount: { type: Number, required: true },
    totalItems: { type: Number, required: true },
    status: { type: String, required: true, enum: ['Pending', 'Preparing', 'Ready for Dispatch', 'Delivered', 'Cancelled'], default: 'Pending' },
    paymentMethod: { type: String, required: true, enum: ['Cash on Delivery', 'Online Payment'], default: 'Cash on Delivery' },
    paymentStatus: { type: String, required: true, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    address: { type: String, required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
}, { timestamps: true });

module.exports = model('orders', schema);