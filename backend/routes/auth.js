const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();

// Route: User Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const userExist = await prisma.user.findUnique({
      where: { email }
    });

    if (userExist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate secure hex token for email verification
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: false,
        verificationToken,
        role: "user" // Default role
      }
    });

    // Send the email (logs to backend console)
    sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: "Registration successful! A verification link has been logged in your backend server logs. Please verify your account.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: User Login (Access Token + Refresh Token)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    // Verify email verification status
    if (!user.verified) {
      return res.status(400).json({ message: "Please verify your email before logging in. Check your backend console logs for the verification link." });
    }

    // Generate Short-lived Access Token (15 Minutes)
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate Long-lived Refresh Token (30 Days)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Save Refresh Token in Database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken
      }
    });

    res.json({
      message: "Login Success",
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Refresh Access Token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Check if refresh token exists in DB
    const tokenInDb = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenInDb) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Verify refresh token signature and expiry
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Refresh token expired or invalid" });
      }

      // Generate a new access token
      const accessToken = jwt.sign(
        { id: tokenInDb.user.id, role: tokenInDb.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: User Logout (Invalidate Refresh Token)
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove token from database if it exists
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Forgot Password (generate recovery token)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // For security, don't reveal if user does not exist
    if (!user) {
      return res.json({ message: "If that email exists, a password reset link has been logged in your backend server logs." });
    }

    // Generate 15-minute token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    // Save reset token in Database (overwrite if exists or create new)
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Send email (logs to backend console)
    sendPasswordResetEmail(email, user.name, token);

    res.json({ message: "If that email exists, a password reset link has been logged in your backend server logs." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find token in DB
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Check expiry
    if (new Date() > resetRequest.expiresAt) {
      // Cleanup expired token
      await prisma.passwordReset.delete({ where: { id: resetRequest.id } });
      return res.status(400).json({ message: "Reset token has expired (15 minutes limit)" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { password: hashedPassword }
    });

    // Delete used token
    await prisma.passwordReset.delete({
      where: { id: resetRequest.id }
    });

    res.json({ message: "Password reset successful! You can now log in with your new password." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Verify Email Link
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null
      }
    });

    res.json({ message: "Email verified successfully! You can now log in." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
