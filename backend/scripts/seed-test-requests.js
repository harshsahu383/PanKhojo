
import "dotenv/config";

import pool from "../config/db.js";
import { createRequest } from "../models/request.model.js";

const testRequests = [
    {
        fullName: "Rahul Sharma",
        email: "rahul.test@example.com",
        phone: "9876543210",
        dateOfBirth: "1998-05-12",
        fatherName: "Amit Sharma",
        city: "Jaipur",
        state: "Rajasthan"
    },
    {
        fullName: "Priya Verma",
        email: "priya.test@example.com",
        phone: "9876501234",
        dateOfBirth: "1995-08-20",
        fatherName: "Rajesh Verma",
        city: "Ajmer",
        state: "Rajasthan"
    },
    {
        fullName: "Aman Singh",
        email: "aman.test@example.com",
        phone: "9876512345",
        dateOfBirth: "2000-01-15",
        fatherName: "Vijay Singh",
        city: "Jodhpur",
        state: "Rajasthan"
    }
];

const seed = async () => {
    try {
        for (const request of testRequests) {
            const result = await createRequest(request);

            console.log(
                `Created fictional test request: ${result.requestNumber}`
            );
        }

        console.log("Test requests created successfully.");
    } catch (error) {
        console.error("Seed error:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

seed();
