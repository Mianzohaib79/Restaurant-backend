const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getRandomID } = require('../config/global');
const { verifyToken } = require('../middlewares/auth');

const Users = require('../models/auth');
const MenuItems = require('../models/menuitems');
const { cloudinary } = require('../config/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Add a new Menu Item
router.post('/add-menuitem', [verifyToken, upload.fields([{ name: 'image' }])], async (req, res) => {
    try {
        const { itemName, itemCategory, itemPrice, status, isPopular } = req.body;
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        if (!itemName || !itemCategory || !itemPrice || !status) {
            return res.status(400).json({ message: 'Required fields are missing', isError: true });
        }

        let imageURL = "", imagePublicId = "";
        if (req.files && req.files['image'] && req.files['image'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'menuitems',
                }, (err, result) => {
                    if (err) { reject(err); return; }
                    imageURL = result.secure_url;
                    imagePublicId = result.public_id;
                    resolve();
                });
                uploadStream.end(req.files['image'][0].buffer);
            });
        }

        if (!imageURL) {
            return res.status(400).json({ message: 'Image is required', isError: true });
        }

        const itemId = getRandomID();
        const newMenuItem = new MenuItems({
            itemId,
            itemName,
            itemCategory,
            itemPrice: Number(itemPrice),
            status: status || 'In Stock',
            isPopular: isPopular === 'true' || isPopular === true,
            imageURL,
            imagePublicId
        });

        await newMenuItem.save();
        res.status(201).json({ success: true, message: 'Menu item added successfully', menuItem: newMenuItem, isError: false });
    } catch (err) {
        console.error("Error in add-menuitem:", err);
        res.status(500).json({ success: false, message: err.message || 'Internal Server Error', isError: true });
    }
});

// GET: Get all Menu Items
router.get('/get-menuitems', async (req, res) => {
    try {
        const menuitems = await MenuItems.find();
        if (!menuitems) {
            return res.status(404).json({ success: false, message: 'No menu items found', isError: true });
        }
        // Return both camelCase and lowercase key for frontend robustness
        res.status(200).json({ success: true, menuitems, menuItems: menuitems, isError: false });
    } catch (err) {
        console.error("Error in get-menuitems:", err);
        res.status(500).json({ success: false, message: err.message || 'Internal Server Error', isError: true });
    }
});

// PUT: Update an existing Menu Item
router.put('/update-menuitem/:itemId', [verifyToken, upload.fields([{ name: 'image' }])], async (req, res) => {
    try {
        const { itemId } = req.params;
        const { itemName, itemCategory, itemPrice, status, isPopular } = req.body;
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        const menuItem = await MenuItems.findOne({ itemId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found', isError: true });
        }

        // Update fields if provided
        if (itemName !== undefined) menuItem.itemName = itemName;
        if (itemCategory !== undefined) menuItem.itemCategory = itemCategory;
        if (itemPrice !== undefined) menuItem.itemPrice = Number(itemPrice);
        if (status !== undefined) menuItem.status = status;
        if (isPopular !== undefined) menuItem.isPopular = isPopular === 'true' || isPopular === true;

        // If new image is uploaded, upload to Cloudinary and delete the old one
        if (req.files && req.files['image'] && req.files['image'][0]) {
            if (menuItem.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(menuItem.imagePublicId);
                } catch (cloudinaryErr) {
                    console.error("Failed to delete old image from Cloudinary:", cloudinaryErr);
                }
            }

            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'menuitems',
                }, (err, result) => {
                    if (err) { reject(err); return; }
                    menuItem.imageURL = result.secure_url;
                    menuItem.imagePublicId = result.public_id;
                    resolve();
                });
                uploadStream.end(req.files['image'][0].buffer);
            });
        }

        await menuItem.save();
        res.status(200).json({ success: true, message: 'Menu item updated successfully', menuItem, isError: false });
    } catch (err) {
        console.error("Error in update-menuitem:", err);
        res.status(500).json({ success: false, message: err.message || 'Internal Server Error', isError: true });
    }
});

// DELETE: Delete a Menu Item
router.delete('/delete-menuitem/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user || user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized', isError: true });
        }

        const menuItem = await MenuItems.findOne({ itemId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found', isError: true });
        }

        // Delete from Cloudinary
        if (menuItem.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(menuItem.imagePublicId);
            } catch (cloudinaryErr) {
                console.error("Failed to delete image from Cloudinary on item deletion:", cloudinaryErr);
            }
        }

        await menuItem.deleteOne();
        res.status(200).json({ success: true, message: 'Menu item deleted successfully', isError: false });
    } catch (err) {
        console.error("Error in delete-menuitem:", err);
        res.status(500).json({ success: false, message: 'Internal Server Error', isError: true });
    }
});

module.exports = router;