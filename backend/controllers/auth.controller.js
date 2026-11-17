
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import {
    findAdminByEmail,
    updateAdminLastLogin
} from "../models/admin.model.js";

const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(200)
});

export const adminLogin = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email and password."
            });
        }

        const { email, password } = validation.data;

        const admin = await findAdminByEmail(email.toLowerCase());

        if (!admin || !admin.is_active) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const token = jwt.sign(
            {
                id: admin.id,
                role: admin.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30m",
                issuer: "pankhojo-api",
                audience: "pankhojo-admin"
            }
        );

        await updateAdminLastLogin(admin.id);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Admin login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to complete login."
        });
    }
};
