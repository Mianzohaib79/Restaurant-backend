require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const auth = require("./routes/auth");
const categories = require("./routes/categories");
const menu = require("./routes/menuitems");
const orders = require("./routes/orderList");

connectDB();

const allowedOrigins = [
    "https://restaurant-frontend-teal-chi.vercel.app",
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", auth);
app.use("/api/categories", categories);
app.use("/api/menu", menu);
app.use("/api/orders", orders);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Restaurant App Server is running successfully!",
        status: "OK",
        timestamp: new Date()
    });
});

const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}


module.exports = app;