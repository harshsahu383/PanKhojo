
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticateAdmin = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const token = authorization.slice(7);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                issuer: "pankhojo-api",
                audience: "pankhojo-admin"
            }
        );

        if (!decoded.id || decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator access required."
            });
        }

        const [admins] = await pool.execute(
            `SELECT id, name, email, role, is_active
       FROM admins
       WHERE id = ?
       LIMIT 1`,
            [decoded.id]
        );

        const admin = admins[0];

        if (!admin || !admin.is_active || admin.role !== "admin") {
            return res.status(401).json({
                success: false,
                message: "Administrator account is inactive or unavailable."
            });
        }

        req.admin = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired session."
            });
        }

        console.error("Admin authentication error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Authentication could not be completed."
        });
    }
};
