import pool from "../config/db.js";

export const insertManualPayment = async ({ paymentReference, amount, currency = "INR", customerPayload }) => {
  await pool.execute(
    `INSERT INTO payment_orders (payment_reference, amount, currency, customer_payload, status)
     VALUES (?, ?, ?, ?, 'created')`,
    [paymentReference, amount, currency, JSON.stringify(customerPayload)]
  );
};

export const getPaymentOrder = async (paymentReference) => {
  const [rows] = await pool.execute(
    `SELECT payment_reference, amount, currency, customer_payload, status,
            customer_utr, request_id, created_at
       FROM payment_orders WHERE payment_reference = ? LIMIT 1`,
    [paymentReference]
  );
  return rows[0] || null;
};

export const submitCustomerUtr = async ({ paymentReference, utr }) => {
  const [result] = await pool.execute(
    `UPDATE payment_orders SET customer_utr = ?, status = 'submitted'
      WHERE payment_reference = ? AND status = 'created'`,
    [utr, paymentReference]
  );
  return result.affectedRows === 1;
};

export const listManualPayments = async () => {
  const [rows] = await pool.execute(
    `SELECT id, payment_reference, amount, currency, status, customer_utr,
            JSON_UNQUOTE(JSON_EXTRACT(customer_payload, '$.fullName')) AS customer_name,
            JSON_UNQUOTE(JSON_EXTRACT(customer_payload, '$.email')) AS customer_email,
            created_at, verified_at, request_id
       FROM payment_orders ORDER BY created_at DESC LIMIT 200`
  );
  return rows;
};

export const finalizeManualPayment = async ({ paymentReference, adminId, decision, adminRemark, customerMessage }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT * FROM payment_orders WHERE payment_reference = ? FOR UPDATE`,
      [paymentReference]
    );
    const order = rows[0];
    if (!order) throw new Error("Payment record not found.");
    if (decision === "verify" && order.status !== "submitted") throw new Error("Only submitted UTRs can be verified.");
    if (decision === "reject" && !["created", "submitted"].includes(order.status)) throw new Error("This payment can no longer be rejected or closed.");

    if (decision === "reject") {
      await connection.execute(
        `UPDATE payment_orders SET status = 'rejected', verified_by = ?, admin_remark = ?, customer_message = ?, verified_at = UTC_TIMESTAMP(3) WHERE id = ?`,
        [adminId, adminRemark, customerMessage || 'We could not match the payment in the merchant bank account. If money was debited, contact support with your UTR.', order.id]
      );
      await connection.commit();
      return { decision, request: null };
    }

    const customer = typeof order.customer_payload === "string" ? JSON.parse(order.customer_payload) : order.customer_payload;
    const requestNumber = `PK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [insert] = await connection.execute(
      `INSERT INTO service_requests
       (request_number, full_name, email, phone, date_of_birth, father_name, city, state,
        aadhaar_encrypted, aadhaar_last4, privacy_consent, terms_consent,
        privacy_policy_version, terms_version, consented_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, UTC_TIMESTAMP(3), 'pending')`,
      [requestNumber, customer.fullName, customer.email, customer.phone,
       customer.dateOfBirth || null, customer.fatherName || null, customer.city || null,
       customer.state || null, customer.aadhaarEncrypted, customer.aadhaarLast4,
       customer.privacyPolicyVersion, customer.termsVersion]
    );
    await connection.execute(
      `INSERT INTO request_logs (request_id, admin_id, action, description)
       VALUES (?, ?, 'payment_verified', 'Manual UPI payment verified against business bank credit')`,
      [insert.insertId, adminId]
    );
    await connection.execute(
      `INSERT INTO request_status_history (request_id, status) VALUES (?, 'pending')`,
      [insert.insertId]
    );
    await connection.execute(
      `UPDATE payment_orders SET status = 'verified', verified_by = ?, admin_remark = ?, customer_message = ?,
       request_id = ?, verified_at = UTC_TIMESTAMP(3) WHERE id = ?`,
      [adminId, adminRemark || null, customerMessage || 'Your payment has been verified and your PAN-finding request has been created.', insert.insertId, order.id]
    );
    await connection.commit();
    return { decision, request: { id: insert.insertId, requestNumber, fullName: customer.fullName, email: customer.email } };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getCustomerPaymentStatus = async ({ paymentReference, utr }) => {
  const [rows] = await pool.execute(
    `SELECT po.payment_reference, po.status, po.amount, po.currency, po.request_id,
            po.created_at, po.verified_at, sr.request_number
       FROM payment_orders po
       LEFT JOIN service_requests sr ON sr.id = po.request_id
      WHERE po.payment_reference = ? AND po.customer_utr = ? LIMIT 1`,
    [paymentReference, utr]
  );
  return rows[0] || null;
};


export const getPublicPaymentTracking = async ({ paymentReference, email }) => {
  const [rows] = await pool.execute(
    `SELECT po.payment_reference, po.amount, po.currency, po.status, po.created_at,
            po.verified_at, po.customer_utr, po.customer_message, sr.request_number
       FROM payment_orders po
       LEFT JOIN service_requests sr ON sr.id = po.request_id
      WHERE po.payment_reference = ?
        AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(po.customer_payload, '$.email'))) = LOWER(?)
      LIMIT 1`,
    [paymentReference, email]
  );
  return rows[0] || null;
};
