const express = require("express");
const router = express.Router();
const Users = require("../models/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/auth");

const { getRandomID } = require("../config/global");

router.post("/register", async (req, res) => {
    try {
        const { fullName, email, phoneNumber, address, password } = req.body;
        if (!fullName || !email || !phoneNumber || !address || !password) { return res.status(400).json({ message: "All fields are required", isError: true }); }

        const user = await Users.findOne({ email });
        if (user) { return res.status(400).json({ message: "User already exists", isError: true }); }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = { uid: getRandomID(), fullName, email, phoneNumber, address, password: hashedPassword };
        const newUser = new Users(userData);
        await newUser.save();
        res.status(201).json({ message: "User created successfully", isError: false, });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) { return res.status(400).json({ message: "All fields are required", isError: true }); }

        const user = await Users.findOne({ email });
        if (!user) { return res.status(400).json({ message: "User not found", isError: true }); }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) { return res.status(400).json({ message: "Invalid credential", isError: true }); }

        if (user.status === "inactive") { return res.status(400).json({ message: "Your account has been deactivated", isError: true }); }

        const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({ message: "User logged in successfully", token, isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
});

router.get("/user", verifyToken, async (req, res) => {
    try {
        const { uid } = req;

        const user = await Users.findOne({ uid });
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }); }

        res.status(200).json({ message: "User profile fetched successfully", user, isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
})

router.get("/users", verifyToken, async (req, res) => {
    try {
        const { uid } = req;

        const user = await Users.findOne({ uid });

        if (user.role !== "superAdmin") { return res.status(403).json({ message: "Unauthorized", isError: true }); }

        const users = await Users.find().select("-password");

        res.status(200).json({ message: "User profile fetched successfully", users, isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
})

router.patch("/update-user-by-superAdmin/:userId", verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await Users.findOne({ uid: userId });
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }); }

        const { fullName, status, address, phoneNumber } = req.body;

        if (!fullName || !status || !address || !phoneNumber) {
            return res.status(400).json({ message: "All fields are required", isError: true });
        }

        const updateUser = await Users.findOneAndUpdate({ uid: userId }, { fullName, status, address, phoneNumber }, { new: true });

        res.status(200).json({ message: "User updated successfully", updateUser, isError: false });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
})

router.delete("/delete-user-by-superAdmin/:userId", verifyToken, async (req, res) => {
    try {
        const { uid } = req;

        const user = await Users.findOne({ uid });

        if (user.role !== "superAdmin") { return res.status(403).json({ message: "Unauthorized", isError: true }); }

        const { userId } = req.params;

        const deletedUser = await Users.findOneAndDelete({ uid: userId });
        if (!deletedUser) { return res.status(404).json({ message: "User not found", isError: true }); }

        res.status(200).json({ message: "User deleted successfully", isError: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
})

// ---- NAYI USER PROFILE EDIT API ENDPOINT START ----
router.patch("/user-profile-edit", verifyToken, async (req, res) => {
    try {
        const { uid } = req; // Token middleware se user ki identity mili

        const user = await Users.findOne({ uid });
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }); }

        const { fullName, phoneNumber, address } = req.body;

        // Validation check jaisa register ya update route me ha
        if (!fullName || !phoneNumber || !address) {
            return res.status(400).json({ message: "All fields are required", isError: true });
        }

        // Database me details update ki ja rhi hain aur updated data filter ho rha ha
        const updatedUser = await Users.findOneAndUpdate(
            { uid },
            { fullName, phoneNumber, address },
            { new: true }
        ).select("-password");

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser, isError: false });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
});
// ---- NAYI USER PROFILE EDIT API ENDPOINT END ----

module.exports = router;