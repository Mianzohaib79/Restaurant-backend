const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized", isError: true });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized", isError: true });
        }

        jwt.verify(token, JWT_SECRET, (err, result) => {
            if (err) { return res.status(401).json({ message: "Unauthorized", isError: true }); }

            req.uid = result.uid;
            next();
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error", isError: true });
    }
}

module.exports = { verifyToken };
