
import "dotenv/config";
import bcrypt from "bcrypt";

import pool from "../config/db.js";
import {
    createAdmin,
    findAdminByEmail
} from "../models/admin.model.js";

const createInitialAdmin = async () => {
    try {
        const name = process.env.ADMIN_INITIAL_NAME?.trim();
        const email = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_INITIAL_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "Set ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD in .env first."
            );
        }

        if (password.length < 12) {
            throw new Error("Admin password must contain at least 12 characters.");
        }

        const existingAdmin = await findAdminByEmail(email);

        if (existingAdmin) {
            throw new Error("An admin with this email already exists.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const adminId = await createAdmin({
            name,
            email,
            passwordHash
        });

        console.log(`Initial administrator created. ID: ${adminId}`);
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

createInitialAdmin();
