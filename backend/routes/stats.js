const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();

// Route: Get dashboard stats (Protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [employees, departments, skills, images] = await Promise.all([
      prisma.employeeProfile.count(),
      prisma.department.count(),
      prisma.skill.count(),
      prisma.employeeImage.count()
    ]);

    res.json({
      employees,
      departments,
      skills,
      images
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
