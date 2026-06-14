const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/rbac");

const prisma = new PrismaClient();

// Route: Get all system users (Restricted to Admins & Managers)
router.get("/users", authMiddleware, authorize("admin", "manager"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true
      },
      orderBy: { id: "asc" }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
