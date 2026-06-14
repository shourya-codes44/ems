const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();

// Route: Get all skills (Protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { skillName: "asc" }
    });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Create a new skill (Protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { skillName } = req.body;

    if (!skillName || !skillName.trim()) {
      return res.status(400).json({ message: "Skill name is required" });
    }

    const skillExists = await prisma.skill.findFirst({
      where: {
        skillName: {
          equals: skillName.trim(),
          mode: "insensitive"
        }
      }
    });

    if (skillExists) {
      return res.status(400).json({ message: "Skill already exists" });
    }

    const newSkill = await prisma.skill.create({
      data: {
        skillName: skillName.trim()
      }
    });

    res.status(201).json(newSkill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
