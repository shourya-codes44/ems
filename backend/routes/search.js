const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/search?q=john
 * Searches across users, departments, and skills using ILIKE
 */
router.get("/", auth, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, results: { employees: [], departments: [], skills: [] } });
    }

    const term = q.trim();

    const [employees, departments, skills] = await Promise.all([
      // Search employees by name, email, designation
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { employeeProfile: { designation: { contains: term, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeProfile: {
            select: {
              id: true,
              designation: true,
              department: { select: { departmentName: true } },
            },
          },
        },
        take: 8,
      }),

      // Search departments
      prisma.department.findMany({
        where: { departmentName: { contains: term, mode: "insensitive" } },
        select: { id: true, departmentName: true, _count: { select: { employeeProfiles: true } } },
        take: 5,
      }),

      // Search skills
      prisma.skill.findMany({
        where: { skillName: { contains: term, mode: "insensitive" } },
        select: { id: true, skillName: true, _count: { select: { employeeSkills: true } } },
        take: 5,
      }),
    ]);

    res.json({ success: true, results: { employees, departments, skills } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
