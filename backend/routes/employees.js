const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/auth");

const prisma = new PrismaClient();

// Multer Storage Configuration
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Multer: Limit to 5 files
const upload = multer({
  storage: storage,
  limits: { files: 5 }
});

// Route: Upload Multiple Documents/Images (Protected)
router.post("/upload", authMiddleware, upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Generate static URLs for frontend consumption
    const fileUrls = req.files.map((file) => {
      return `http://localhost:5000/uploads/${file.filename}`;
    });

    res.json({ urls: fileUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Get All Employees (Protected - Includes Joined Relations)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const employees = await prisma.employeeProfile.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        department: true,
        images: true,
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: { id: "asc" }
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Get raw SQL join queries (For Educational Display in Assignments)
router.get("/raw-joins", authMiddleware, async (req, res) => {
  try {
    // Join 1: Get name and department name
    const join1 = await prisma.$queryRawUnsafe(`
      SELECT
        u.name,
        d.department_name as department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id;
    `);

    // Join 2: Get name and skill name
    const join2 = await prisma.$queryRawUnsafe(`
      SELECT
        u.name,
        s.skill_name as skill_name
      FROM employee_skills es
      INNER JOIN employee_profiles ep ON es.employee_id = ep.id
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN skills s ON es.skill_id = s.id;
    `);

    res.json({ join1, join2 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Get Single Employee (Protected)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        department: true,
        images: true,
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Create Employee Profile (Protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId, departmentId, phone, address, designation, salary, skills, images } = req.body;

    if (!userId || !departmentId || !phone || !address || !designation || !salary) {
      return res.status(400).json({ message: "All profile fields are required" });
    }

    // Check if user already has a profile
    const profileExists = await prisma.employeeProfile.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (profileExists) {
      return res.status(400).json({ message: "This user already has a corporate profile" });
    }

    const newProfile = await prisma.employeeProfile.create({
      data: {
        userId: parseInt(userId),
        departmentId: parseInt(departmentId),
        phone,
        address,
        designation,
        salary: parseFloat(salary),
        skills: {
          create: (skills || []).map((skillId) => ({
            skillId: parseInt(skillId)
          }))
        },
        images: {
          create: (images || []).map((url) => ({
            imageUrl: url
          }))
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        department: true
      }
    });

    // Initialize leave balance records for all active leave types
    const leaveTypes = await prisma.leaveType.findMany();
    if (leaveTypes.length > 0) {
      await prisma.leaveBalance.createMany({
        data: leaveTypes.map((lt) => ({
          employeeId: newProfile.id,
          leaveTypeId: lt.id,
          availableDays: lt.totalDays
        }))
      });
    }

    res.status(201).json(newProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Update Employee Profile (Protected)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, phone, address, designation, salary, skills, images } = req.body;

    if (!departmentId || !phone || !address || !designation || !salary) {
      return res.status(400).json({ message: "All profile fields are required" });
    }

    // Find profile
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(id) }
    });

    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Update main fields
    await prisma.employeeProfile.update({
      where: { id: parseInt(id) },
      data: {
        departmentId: parseInt(departmentId),
        phone,
        address,
        designation,
        salary: parseFloat(salary)
      }
    });

    // Update skills: Delete old, add new
    await prisma.employeeSkill.deleteMany({
      where: { employeeId: parseInt(id) }
    });
    if (skills && skills.length > 0) {
      await prisma.employeeSkill.createMany({
        data: skills.map((skillId) => ({
          employeeId: parseInt(id),
          skillId: parseInt(skillId)
        }))
      });
    }

    // Update images: Delete old, add new
    await prisma.employeeImage.deleteMany({
      where: { employeeId: parseInt(id) }
    });
    if (images && images.length > 0) {
      await prisma.employeeImage.createMany({
        data: images.map((url) => ({
          employeeId: parseInt(id),
          imageUrl: url
        }))
      });
    }

    const updatedProfile = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { name: true, email: true }
        },
        department: true,
        images: true,
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: Delete Employee Profile (Protected)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.employeeProfile.findUnique({
      where: { id: parseInt(id) }
    });

    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Delete record (cascading deletes skills and images automatically)
    await prisma.employeeProfile.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Employee profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
