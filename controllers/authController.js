
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate input
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Find user
        const user = await User.findOne({
            email: email.trim()
        }).select("+passwordHash");

        if (!user) {
            console.log("Login failed: User not found");

            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!user.active) {
            console.log("Login failed: Inactive account");

            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!user.passwordHash) {
            console.log("Login failed: Password hash missing");

            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isMatch) {
            console.log("Login failed: Incorrect password");

            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {},
            process.env.JWT_SECRET,
            {
                subject: user._id.toString(),
                algorithm: "HS256",
                expiresIn: "1h"
            }
        );

        // Check student ID
        if (user.role === "student") {
            console.log(
                "Student ID available:",
                Boolean(user.studentId)
            );
        }

        // Return user information
        return res.status(200).json({
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId || null,
                advisorId: user.advisorId || null,
                active: user.active
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to sign in. Please try again."
        });
    }
};
