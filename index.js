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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", auth);
app.use("/api/categories", categories);
app.use("/api/menu", menu);
app.use("/api/orders", orders);

const { PORT = 8000 } = process.env;

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
