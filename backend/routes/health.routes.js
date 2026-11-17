
import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "PANKhojo API is running",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(503).json({
            success: false,
            message: "API is running, but database is unavailable",
            database: "disconnected"
        });
    }
});

export default router;
