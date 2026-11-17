
import pool from "../config/db.js";

export const createRequest = async (data) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const requestNumber = `PK-${Date.now()}-${Math.floor(
            1000 + Math.random() * 9000
        )}`;

        const [result] = await connection.execute(
            `INSERT INTO service_requests
       (request_number, full_name, email, phone, date_of_birth,
        father_name, city, state, aadhaar_encrypted, aadhaar_last4,
        privacy_consent, terms_consent, privacy_policy_version, terms_version,
        consented_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), 'pending')`,
            [
                requestNumber,
                data.fullName,
                data.email,
                data.phone,
                data.dateOfBirth || null,
                data.fatherName || null,
                data.city || null,
                data.state || null,
                data.aadhaarEncrypted,
                data.aadhaarLast4,
                data.privacyConsent,
                data.termsConsent,
                data.privacyPolicyVersion,
                data.termsVersion
            ]
        );

        await connection.execute(
            `INSERT INTO request_logs
       (request_id, admin_id, action, description)
       VALUES (?, NULL, 'request_created', 'Request created through the system')`,
            [result.insertId]
        );

        await connection.commit();

        return {
            id: result.insertId,
            requestNumber
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};


export const getRequests = async ({
    page = 1,
    limit = 10,
    status,
    search
}) => {
    // Ensure LIMIT and OFFSET are safe integers.
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(Number(limit) || 10)));
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    const values = [];

    if (status) {
        conditions.push("status = ?");
        values.push(status);
    }

    if (search) {
        conditions.push(
            "(request_number LIKE ? OR full_name LIKE ? OR email LIKE ?)"
        );

        const term = `%${search}%`;
        values.push(term, term, term);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
        `SELECT
            id, request_number, full_name, email, phone, aadhaar_last4,
            status, created_at, updated_at,
            (SELECT l.description
             FROM request_logs l
             WHERE l.request_id = service_requests.id
               AND l.action = 'status_updated'
             ORDER BY l.created_at DESC, l.id DESC
             LIMIT 1) AS latest_status_remark
         FROM service_requests
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${safeLimit} OFFSET ${offset}`,
        values
    );

    const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM service_requests
         ${whereClause}`,
        values
    );

    return {
        requests: rows,
        total: Number(countRows[0].total),
        page: safePage,
        limit: safeLimit
    };
};


export const getRequestById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT id, request_number, full_name, email, phone, date_of_birth,
            father_name, city, state, aadhaar_last4,
            privacy_consent, terms_consent, privacy_policy_version,
            terms_version, consented_at,
            status, created_at, updated_at,
       (SELECT l.description FROM request_logs l
          WHERE l.request_id = service_requests.id AND l.action = 'status_updated'
          ORDER BY l.created_at DESC, l.id DESC LIMIT 1) AS latest_status_remark
     FROM service_requests
     WHERE id = ?
     LIMIT 1`,
        [id]
    );

    return rows[0] || null;
};


export const getEncryptedAadhaarById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT aadhaar_encrypted FROM service_requests WHERE id = ? LIMIT 1`,
        [id]
    );
    return rows[0]?.aadhaar_encrypted || null;
};

export const updateRequestStatus = async ({
    requestId,
    adminId,
    status,
    description,
    customerMessage
}) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE service_requests
       SET status = ?, customer_message = ?
       WHERE id = ?`,
            [status, ["rejected", "cancelled"].includes(status) ? (customerMessage || null) : null, requestId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        await connection.execute(
            `INSERT INTO request_logs
       (request_id, admin_id, action, description)
       VALUES (?, ?, 'status_updated', ?)`,
            [requestId, adminId, description || `Status changed to ${status}`]
        );

        await connection.execute(
            `INSERT INTO request_status_history (request_id, status) VALUES (?, ?)`,
            [requestId, status]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getRequestLogs = async (requestId) => {
    const [rows] = await pool.execute(
        `SELECT
       l.id,
       l.action,
       l.description,
       l.created_at,
       a.name AS admin_name
     FROM request_logs l
     LEFT JOIN admins a ON a.id = l.admin_id
     WHERE l.request_id = ?
     ORDER BY l.created_at DESC`,
        [requestId]
    );

    return rows;
};

export const recordAadhaarAccess = async ({ requestId, adminId }) => {
    await pool.execute(
        `INSERT INTO request_logs (request_id, admin_id, action, description)
         VALUES (?, ?, 'aadhaar_viewed', 'Authorised administrator viewed the decrypted Aadhaar value')`,
        [requestId, adminId]
    );
};


// Public tracking deliberately returns only request status information.
// Customer identity fields and internal admin notes are never exposed.
export const getPublicRequestTracking = async ({ requestNumber, email }) => {
    const [requests] = await pool.execute(
        `SELECT id, request_number, status, created_at, updated_at, customer_message
           FROM service_requests
          WHERE request_number = ? AND LOWER(email) = LOWER(?)
          LIMIT 1`,
        [requestNumber, email]
    );
    const request = requests[0];
    if (!request) return null;

    const [history] = await pool.execute(
        `SELECT status, changed_at
           FROM request_status_history
          WHERE request_id = ?
          ORDER BY changed_at ASC, id ASC`,
        [request.id]
    );

    return {
        requestNumber: request.request_number,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        customerMessage: ["rejected", "cancelled"].includes(request.status) ? request.customer_message : null,
        history
    };
};

export const completeRequestWithPan = async ({ requestId, adminId, panEncrypted }) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            `SELECT id, status, pan_delivery_sent_at FROM service_requests WHERE id = ? FOR UPDATE`, [requestId]
        );
        if (!rows[0]) { await connection.rollback(); return { found: false }; }
        if (rows[0].status === "completed" && rows[0].pan_delivery_sent_at) {
            await connection.rollback(); return { found: true, alreadyDelivered: true };
        }
        await connection.execute(
            `UPDATE service_requests SET status = 'completed', pan_encrypted = ?, pan_delivery_sent_at = NULL WHERE id = ?`,
            [panEncrypted, requestId]
        );
        await connection.execute(
            `INSERT INTO request_logs (request_id, admin_id, action, description) VALUES (?, ?, 'status_updated', 'Request marked completed; PAN delivery initiated')`,
            [requestId, adminId]
        );
        await connection.execute(`INSERT INTO request_status_history (request_id, status) VALUES (?, 'completed')`, [requestId]);
        await connection.commit();
        return { found: true, alreadyDelivered: false };
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
};

export const markPanDeliverySent = async (requestId) => {
    await pool.execute(`UPDATE service_requests SET pan_delivery_sent_at = UTC_TIMESTAMP(3) WHERE id = ? AND status = 'completed'`, [requestId]);
};
