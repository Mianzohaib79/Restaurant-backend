const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Orders = require('../models/order');
const User = require('../models/auth');
const MenuItem = require('../models/menuitems');

const { verifyToken } = require('../middlewares/auth');
const { getRandomID } = require('../config/global');

// Create order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { uid } = req;
        const { items, totalAmount, totalItems, address, fullName, phoneNumber, paymentMethod } = req.body;

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found', isError: true });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart items are required', isError: true });
        }

        if (!address || !fullName || !phoneNumber) {
            return res.status(400).json({ message: 'Customer details are required', isError: true });
        }

        const orderItems = [];

        for (const item of items) {
            const id = item.menuItemId || item.itemId || item._id || item.id;
            const quantity = Number(item.quantity);

            if (!id || !quantity || quantity < 1) {
                return res.status(400).json({ message: 'Invalid cart item data', isError: true });
            }

            const itemQuery = [{ itemId: id }];
            if (mongoose.Types.ObjectId.isValid(id)) {
                itemQuery.push({ _id: id });
            }

            const menuItem = await MenuItem.findOne({ $or: itemQuery });

            if (!menuItem) {
                return res.status(404).json({ message: 'Menu item not found', isError: true });
            }

            orderItems.push({
                menuItemId: menuItem._id,
                quantity,
                price: Number(menuItem.itemPrice),
                name: menuItem.itemName
            });
        }

        const calculatedItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const calculatedAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = new Orders({
            uid,
            orderId: getRandomID(),
            items: orderItems,
            totalItems: Number(totalItems) || calculatedItems,
            totalAmount: Number(totalAmount) || calculatedAmount,
            status: 'Pending',
            paymentMethod: paymentMethod || 'Cash on Delivery',
            paymentStatus: 'Pending',
            address,
            fullName,
            phoneNumber,
            email: user.email
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order,
            isError: false
        });
    } catch (err) {
        console.error('Create order failed:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error', isError: true });
    }
});

// Get logged-in user's orders
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Orders.find({ uid: req.uid }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders, isError: false });
    } catch (err) {
        console.error('Get my orders failed:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error', isError: true });
    }
});

// Get all orders for dashboard
router.get('/get-orders', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        const orders = await Orders.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders, isError: false });
    } catch (err) {
        console.error('Get orders failed:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error', isError: true });
    }
});

// Update order status (Naya API Route jo aap ne bola tha)
router.put('/update-status', verifyToken, async (req, res) => {
    try {
        // SuperAdmin role check jaisa baqi admin routes me ha
        const user = await User.findOne({ uid: req.uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ message: 'Order ID and Status are required', isError: true });
        }

        // Database me status ko update karna
        const updatedOrder = await Orders.findByIdAndUpdate(
            orderId,
            { status },
            { new: true } // Taakay updated data return ho
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found', isError: true });
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully', order: updatedOrder, isError: false });
    } catch (err) {
        console.error('Update order status failed:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error', isError: true });
    }
});

// Get dashboard statistics
router.get('/dashboard-stats', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        // 1. Total Revenue (non-cancelled orders)
        const revenueResult = await Orders.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // 2. Total Orders
        const totalOrders = await Orders.countDocuments();

        // 3. Active Users (both active customers and active admins, but let's count active customer users as requested)
        const activeUsers = await User.countDocuments({ status: 'active', role: 'customer' });

        // 4. Growth Rate Calculation (current month vs previous month revenue)
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const currentMonthRevenueResult = await Orders.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfCurrentMonth },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const prevMonthRevenueResult = await Orders.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const currentMonthRevenue = currentMonthRevenueResult[0]?.total || 0;
        const prevMonthRevenue = prevMonthRevenueResult[0]?.total || 0;

        let growthRate = 0;
        if (prevMonthRevenue > 0) {
            growthRate = parseFloat(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1));
        } else if (currentMonthRevenue > 0) {
            growthRate = 100;
        }

        // 5. Recent Orders (latest 5 orders)
        const recentOrders = await Orders.find().sort({ createdAt: -1 }).limit(5);

        // 6. Order Status Distribution
        const statusDistribution = await Orders.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusCounts = {
            'Pending': 0,
            'Preparing': 0,
            'Ready for Dispatch': 0,
            'Delivered': 0,
            'Cancelled': 0
        };
        statusDistribution.forEach(item => {
            if (item._id in statusCounts) {
                statusCounts[item._id] = item.count;
            }
        });

        // 7. Payment Method Distribution
        const paymentDistribution = await Orders.aggregate([
            { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
        ]);
        const paymentCounts = {
            'Cash on Delivery': 0,
            'Online Payment': 0
        };
        paymentDistribution.forEach(item => {
            if (item._id in paymentCounts) {
                paymentCounts[item._id] = item.count;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                activeUsers,
                growthRate,
                recentOrders,
                statusDistribution: statusCounts,
                paymentDistribution: paymentCounts
            },
            isError: false
        });
    } catch (err) {
        console.error('Get dashboard stats failed:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error', isError: true });
    }
});

module.exports = router;