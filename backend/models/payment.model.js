import pool from "../config/db.js";

export const insertManualPayment = async ({ paymentReference, amount, currency = "INR", customerPayload }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO payment_orders (payment_reference, amount, currency, customer_payload, status, created_at)
       VALUES (?, ?, ?, ?, 'created', UTC_TIMESTAMP(3))`,
      [paymentReference, amount, currency, JSON.stringify(customerPayload)]
    );
    // Lead records intentionally contain only contact details.
    await connection.execute(
      `INSERT INTO customer_leads (payment_reference, full_name, email, phone)
       VALUES (?, ?, ?, ?)`,
      [paymentReference, customerPayload.fullName, customerPayload.email, customerPayload.phone]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

export const submitCustomerUtr = async ({ paymentReference, utr, customerPayload }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT * FROM payment_orders WHERE payment_reference = ? FOR UPDATE`,
      [paymentReference]
    );
    const order = rows[0];
    if (!order) {
      await connection.rollback();
      return { updated: false, reason: "not_found" };
    }

    // Expire a checkout server-side after five minutes, even if the browser timer is manipulated.
    const [expiredRows] = await connection.execute(
      `UPDATE payment_orders
          SET status = 'expired', customer_message = 'Checkout expired after five minutes. Please contact support if you already transferred money.'
        WHERE id = ? AND status = 'created'
          AND created_at <= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE)`,
      [order.id]
    );
    if (expiredRows.affectedRows === 1) {
      await connection.commit();
      return { updated: false, reason: "expired" };
    }

    // Idempotent retry: return the existing request if the same checkout was already submitted.
    if (order.status === "submitted" && order.request_id) {
      if (order.customer_utr !== utr) {
        await connection.rollback();
        return { updated: false, reason: "already_submitted" };
      }
      const [existing] = await connection.execute(
        `SELECT request_number FROM service_requests WHERE id = ? LIMIT 1`,
        [order.request_id]
      );
      await connection.commit();
      return { updated: true, alreadySubmitted: true, requestNumber: existing[0]?.request_number || null };
    }
    if (order.status === "expired") {
      await connection.rollback();
      return { updated: false, reason: "expired" };
    }
    if (order.status !== "created") {
      await connection.rollback();
      return { updated: false, reason: "inactive" };
    }

    const customer = customerPayload || (typeof order.customer_payload === "string"
      ? JSON.parse(order.customer_payload)
      : order.customer_payload);
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
       VALUES (?, NULL, 'request_created', 'Request created after customer submitted UPI UTR; payment verification pending')`,
      [insert.insertId]
    );
    await connection.execute(
      `INSERT INTO request_status_history (request_id, status) VALUES (?, 'pending')`,
      [insert.insertId]
    );
    const [updated] = await connection.execute(
      `UPDATE payment_orders
          SET customer_utr = ?, status = 'submitted', request_id = ?
        WHERE id = ? AND status = 'created'`,
      [utr, insert.insertId, order.id]
    );
    if (updated.affectedRows !== 1) {
      throw new Error("Payment submission state changed. Please refresh and check the payment reference.");
    }
    await connection.commit();
    return { updated: true, alreadySubmitted: false, requestNumber };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const expirePendingPayments = async () => {
  const [result] = await pool.execute(
    `UPDATE payment_orders
        SET status = 'expired', customer_message = 'Checkout expired after five minutes.'
      WHERE status = 'created'
        AND created_at <= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE)`
  );
  return result.affectedRows || 0;
};

export const listManualPayments = async () => {
  const [rows] = await pool.execute(
    `SELECT po.id, po.payment_reference, po.amount, po.currency, po.status, po.customer_utr,
            COALESCE(cl.full_name, JSON_UNQUOTE(JSON_EXTRACT(po.customer_payload, '$.fullName'))) AS customer_name,
            COALESCE(cl.email, JSON_UNQUOTE(JSON_EXTRACT(po.customer_payload, '$.email'))) AS customer_email,
            COALESCE(cl.phone, JSON_UNQUOTE(JSON_EXTRACT(po.customer_payload, '$.phone'))) AS customer_phone,
            po.created_at, po.verified_at, po.request_id
       FROM payment_orders po
       LEFT JOIN customer_leads cl ON cl.payment_reference = po.payment_reference
       ORDER BY po.created_at DESC LIMIT 200`
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

    if (decision === "verify") {
      if (order.status !== "submitted") {
        throw new Error("Only submitted UTRs can be verified.");
      }
      let request;
      if (order.request_id) {
        const [requestRows] = await connection.execute(
          `SELECT id, request_number, full_name, email FROM service_requests WHERE id = ? FOR UPDATE`,
          [order.request_id]
        );
        request = requestRows[0];
        if (!request) throw new Error("The linked customer request could not be found.");
      } else {
        // Backward compatibility for UTRs submitted before this deployment,
        // when the previous flow created the request only after admin approval.
        const customer = typeof order.customer_payload === "string"
          ? JSON.parse(order.customer_payload)
          : order.customer_payload;
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
        request = { id: insert.insertId, request_number: requestNumber, full_name: customer.fullName, email: customer.email };
        await connection.execute(
          `INSERT INTO request_logs (request_id, admin_id, action, description)
           VALUES (?, ?, 'request_created', 'Legacy payment request created after manual payment verification')`,
          [request.id, adminId]
        );
        await connection.execute(
          `INSERT INTO request_status_history (request_id, status) VALUES (?, 'pending')`,
          [request.id]
        );
      }
      await connection.execute(
        `UPDATE payment_orders
            SET status = 'verified', verified_by = ?, admin_remark = ?, customer_message = ?,
                request_id = ?, verified_at = UTC_TIMESTAMP(3)
          WHERE id = ?`,
        [adminId, adminRemark || null, customerMessage || "Your payment has been verified. Your request is now ready for processing.", request.id, order.id]
      );
      await connection.execute(
        `INSERT INTO request_logs (request_id, admin_id, action, description)
         VALUES (?, ?, 'payment_verified', 'Manual UPI payment verified against business bank credit')`,
        [request.id, adminId]
      );
      await connection.commit();
      return { decision, request: { id: request.id, requestNumber: request.request_number, fullName: request.full_name, email: request.email } };
    }

    if (order.status !== "created" && order.status !== "submitted") {
      throw new Error("This payment can no longer be rejected or closed.");
    }
    if (order.request_id) {
      await connection.execute(
        `UPDATE service_requests SET status = 'rejected', customer_message = ? WHERE id = ?`,
        [customerMessage || "We could not match the submitted payment. Please contact support before paying again.", order.request_id]
      );
      await connection.execute(
        `INSERT INTO request_logs (request_id, admin_id, action, description)
         VALUES (?, ?, 'status_updated', ?)`,
        [order.request_id, adminId, adminRemark || "Payment could not be matched in the merchant bank account"]
      );
      await connection.execute(
        `INSERT INTO request_status_history (request_id, status) VALUES (?, 'rejected')`,
        [order.request_id]
      );
    }
    await connection.execute(
      `UPDATE payment_orders
          SET status = 'rejected', verified_by = ?, admin_remark = ?, customer_message = ?,
              verified_at = UTC_TIMESTAMP(3)
        WHERE id = ?`,
      [adminId, adminRemark, customerMessage || "We could not match the payment in the merchant bank account. If money was debited, contact support with your UTR.", order.id]
    );
    await connection.commit();
    return { decision, request: null };
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
        AND (
          EXISTS (SELECT 1 FROM customer_leads cl WHERE cl.payment_reference = po.payment_reference AND LOWER(cl.email) = LOWER(?))
          OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(po.customer_payload, '$.email'))) = LOWER(?)
        )
      LIMIT 1`,
    [paymentReference, email, email]
  );
  return rows[0] || null;
};
