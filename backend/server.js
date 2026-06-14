require("dotenv").config();

// BigInt Serialization Fallback for Express / JSON.stringify
BigInt.prototype.toJSON = function() {
  return Number(this);
};

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const logger = require("./utils/logger");
const { runMigrations } = require("./utils/dbMigrations");
const errorHandler = require("./middleware/errorHandler");

// Swagger UI configuration
const { swaggerUi, swaggerDocument } = require("./config/swagger");

// Routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const departmentRoutes = require("./routes/departments");
const skillRoutes = require("./routes/skills");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const reportRoutes = require("./routes/reports");
const assetRoutes = require("./routes/assets");
const notificationRoutes = require("./routes/notifications");
const searchRoutes = require("./routes/search");

const app = express();
const prisma = new PrismaClient();

// Security Middleware: HTTP Headers protection
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading uploaded images directly on frontend
}));

// Security Middleware: Rate Limiting (raised to 500 for dashboard chart fetches)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use("/api/", apiLimiter);

app.use(cors());
app.use(express.json());

// Serve static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount Swagger Documentation Dashboard
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

// ─── Global Error Handler (must be LAST) ────────────────────────────────────
app.use(errorHandler);

// ─── Seeder ─────────────────────────────────────────────────────────────────
async function seedAdminAndProfile() {
  try {
    // 1. Seed Departments
    const depts = ["IT", "HR", "Finance", "Marketing"];
    for (const name of depts) {
      const exists = await prisma.department.findFirst({ where: { departmentName: name } });
      if (!exists) {
        await prisma.department.create({ data: { departmentName: name } });
        logger.info(`💼 Seeded Department: ${name}`);
      }
    }

    // 2. Seed Skills
    const skills = ["React", "NodeJS", "PostgreSQL", "Python", "Java", "Docker", "AWS", "TypeScript"];
    for (const name of skills) {
      const exists = await prisma.skill.findFirst({ where: { skillName: name } });
      if (!exists) {
        await prisma.skill.create({ data: { skillName: name } });
        logger.info(`🛠️ Seeded Skill: ${name}`);
      }
    }

    // 3. Seed Leave Types
    const leaveTypes = [
      { name: "Casual Leave", days: 10 },
      { name: "Sick Leave", days: 10 },
      { name: "Earned Leave", days: 15 },
      { name: "Maternity Leave", days: 90 }
    ];
    for (const lt of leaveTypes) {
      const exists = await prisma.leaveType.findFirst({ where: { leaveName: lt.name } });
      if (!exists) {
        await prisma.leaveType.create({ data: { leaveName: lt.name, totalDays: lt.days } });
        logger.info(`🌴 Seeded Leave Type: ${lt.name} (${lt.days} days)`);
      }
    }

    // 4. Seed Default Admin User
    const adminExists = await prisma.user.findFirst({ where: { role: "admin" } });
    let adminUser = adminExists;

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      adminUser = await prisma.user.create({
        data: {
          name: "System Admin",
          email: "admin@ems.com",
          password: hashedPassword,
          role: "admin",
          verified: true
        }
      });

      logger.info("==============================================");
      logger.info("👑 DEFAULT ADMIN USER CREATED SUCCESSFULLY");
      logger.info(`Email:    ${adminUser.email}`);
      logger.info("Password: admin123");
      logger.info("==============================================");
    } else {
      logger.info(`👑 Admin account active: ${adminUser.email}`);
    }

    // 5. Seed Admin's Corporate Employee Profile & Leave Balances
    const profileExists = await prisma.employeeProfile.findUnique({ where: { userId: adminUser.id } });

    if (!profileExists) {
      const itDept = await prisma.department.findFirst({ where: { departmentName: "IT" } });

      const adminProfile = await prisma.employeeProfile.create({
        data: {
          userId: adminUser.id,
          departmentId: itDept.id,
          phone: "+1 555 123-4567",
          address: "123 Admin HQ, System City",
          designation: "System Administrator",
          salary: 150000.00
        }
      });

      logger.info(`💼 Created Admin Employee Profile (ID: ${adminProfile.id})`);

      const activeLeaveTypes = await prisma.leaveType.findMany();
      for (const lt of activeLeaveTypes) {
        await prisma.leaveBalance.create({
          data: { employeeId: adminProfile.id, leaveTypeId: lt.id, availableDays: lt.totalDays }
        });
      }
    }
  } catch (error) {
    logger.error("❌ Seeding failed: " + error.message);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`🚀 EMS Server running on port ${PORT}`);
  await seedAdminAndProfile();
  await runMigrations();
});
