const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth");
const Category = require("../models/categories");
const Users = require("../models/auth")
const { getRandomID } = require("../config/global");

router.post("/add-category", verifyToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user || user.role !== "superAdmin") return res.status(403).json({ message: "Unauthorized" });

        if (!name) return res.status(400).json({ message: "Please provide category name" });
        if (!description) return res.status(400).json({ message: "Please provide category description" });

        const id = getRandomID();

        const existingCategory = await Category.findOne({ name, id });
        if (existingCategory) return res.status(400).json({ message: "Category already exists" });

        const newCategory = new Category({ name, description, id });

        await newCategory.save();
        res.status(201).json({ message: "Category added successfully", isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error, isError: true })
    }
})

router.get("/get-categories", async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ categories, isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error, isError: true });
    }
})

router.delete("/delete-category/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user || user.role !== "superAdmin") return res.status(403).json({ message: "Unauthorized" });

        const deletedCategory = await Category.findOne({ id });
        if (!deletedCategory) return res.status(404).json({ message: "Category not found", isError: true });

        await deletedCategory.deleteOne();

        res.status(200).json({ message: "Category deleted successfully", isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error, isError: true });
    }
})

module.exports = router;