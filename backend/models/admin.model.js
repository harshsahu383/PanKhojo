
import pool from "../config/db.js";

export const findAdminByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT id, name, email, password_hash, role, is_active
     FROM admins
     WHERE email = ?
     LIMIT 1`,
        [email]
    );

    return rows[0] || null;
};

export const createAdmin = async ({
    name,
    email,
    passwordHash
}) => {
    const [result] = await pool.execute(
        `INSERT INTO admins (name, email, password_hash)
     VALUES (?, ?, ?)`,
        [name, email, passwordHash]
    );

    return result.insertId;
};

export const updateAdminLastLogin = async (adminId) => {
    await pool.execute(
        `UPDATE admins
     SET last_login_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [adminId]
    );
};
