const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();

// Route: Get all departments (Protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { id: "asc" }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Create a new department (Protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { departmentName } = req.body;

    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const nameExists = await prisma.department.findFirst({
      where: {
        departmentName: {
          equals: departmentName.trim(),
          mode: "insensitive"
        }
      }
    });

    if (nameExists) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const newDept = await prisma.department.create({
      data: {
        departmentName: departmentName.trim()
      }
    });

    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
