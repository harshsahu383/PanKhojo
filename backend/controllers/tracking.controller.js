import { z } from "zod";
import { getPublicRequestTracking } from "../models/request.model.js";

const trackingSchema = z.object({
  requestNumber: z.string().trim().min(5).max(40).regex(/^[A-Za-z0-9-]+$/),
  email: z.string().trim().email().max(255)
}).strict();

export const trackRequest = async (req, res) => {
  const validation = trackingSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: "Enter a valid request reference and email address." });
  }

  res.set("Cache-Control", "no-store");
  try {
    const result = await getPublicRequestTracking({
      requestNumber: validation.data.requestNumber.toUpperCase(),
      email: validation.data.email.trim()
    });

    // Use the same response for unknown references and email mismatches.
    if (!result) {
      return res.status(404).json({ success: false, message: "We could not find a request matching those details. Check your reference and registered email." });
    }

    return res.status(200).json({ success: true, tracking: result });
  } catch (error) {
    console.error("Public request tracking error:", error.message);
    return res.status(500).json({ success: false, message: "Tracking is temporarily unavailable. Please try again later." });
  }
};
