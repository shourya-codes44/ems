const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ReportRepository {
  // Aggregate Metrics for Dashboard
  async getDashboardAnalytics() {
    const [employees, departments, leavesTotal, pendingApprovals, approvedLeaves, rejectedLeaves] = await Promise.all([
      prisma.employeeProfile.count(),
      prisma.department.count(),
      prisma.leaveApplication.count(),
      prisma.leaveApplication.count({ where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } } }),
      prisma.leaveApplication.count({ where: { status: "APPROVED" } }),
      prisma.leaveApplication.count({ where: { status: "REJECTED" } })
    ]);

    return {
      employees,
      departments,
      leavesTotal,
      pendingApprovals,
      approvedLeaves,
      rejectedLeaves
    };
  }

  // HR Report: Employee Wise Leave Count
  async getEmployeeWiseLeaves() {
    return prisma.$queryRawUnsafe(`
      SELECT 
        u.name,
        u.email,
        COUNT(la.id)::int as total_leaves,
        COALESCE(SUM(la.total_days), 0)::int as total_days_absent
      FROM users u
      INNER JOIN employee_profiles ep ON ep.user_id = u.id
      LEFT JOIN leave_applications la ON la.employee_id = ep.id AND la.status = 'APPROVED'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_days_absent DESC;
    `);
  }

  // HR Report: Department Wise Leave Count
  async getDepartmentWiseLeaves() {
    return prisma.$queryRawUnsafe(`
      SELECT 
        d.department_name,
        COUNT(la.id)::int as total_leaves,
        COALESCE(SUM(la.total_days), 0)::int as total_days_absent
      FROM departments d
      INNER JOIN employee_profiles ep ON ep.department_id = d.id
      LEFT JOIN leave_applications la ON la.employee_id = ep.id AND la.status = 'APPROVED'
      GROUP BY d.id, d.department_name
      ORDER BY total_days_absent DESC;
    `);
  }

  // HR Report: Leave Balance Report
  async getLeaveBalancesReport() {
    return prisma.$queryRawUnsafe(`
      SELECT 
        u.name,
        lt.leave_name,
        lb.available_days
      FROM leave_balance lb
      INNER JOIN employee_profiles ep ON lb.employee_id = ep.id
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN leave_types lt ON lb.leave_type_id = lt.id
      ORDER BY u.name, lt.leave_name;
    `);
  }

  // Advanced SQL SandBox Queries
  async executeWindowFunction() {
    // Window function: DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC)
    return prisma.$queryRawUnsafe(`
      SELECT 
        u.name,
        d.department_name,
        ep.designation,
        ep.salary,
        DENSE_RANK() OVER (PARTITION BY ep.department_id ORDER BY ep.salary DESC) as salary_rank
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id;
    `);
  }

  async executeSubQuery() {
    // Subquery: employees earning more than the overall average salary
    return prisma.$queryRawUnsafe(`
      SELECT 
        u.name,
        ep.designation,
        ep.salary
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      WHERE ep.salary > (
        SELECT AVG(salary) FROM employee_profiles
      )
      ORDER BY ep.salary DESC;
    `);
  }

  async executeGroupByAggregate() {
    // Group By and Aggregate Functions: SUM, COUNT, AVG, MAX, MIN
    return prisma.$queryRawUnsafe(`
      SELECT 
        d.department_name,
        COUNT(ep.id) as employee_count,
        SUM(ep.salary) as total_salary,
        ROUND(AVG(ep.salary), 2) as average_salary,
        MAX(ep.salary) as max_salary,
        MIN(ep.salary) as min_salary
      FROM departments d
      LEFT JOIN employee_profiles ep ON ep.department_id = d.id
      GROUP BY d.id, d.department_name
      ORDER BY employee_count DESC;
    `);
  }

  // Chart: Employees per Department (for Bar Chart)
  async getDepartmentStats() {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        d.department_name AS "departmentName",
        COUNT(ep.id)::int AS "employeeCount"
      FROM departments d
      LEFT JOIN employee_profiles ep ON ep.department_id = d.id
      GROUP BY d.id, d.department_name
      ORDER BY "employeeCount" DESC;
    `);
    return rows;
  }

  // Chart: Monthly Leave Applications (Area Chart)
  async getMonthlyLeaves() {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COUNT(*)::int AS applications
      FROM leave_applications
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at);
    `);
    return rows;
  }

  // Chart: Monthly Hiring Trend (Line Chart)
  async getHiringTrend() {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COUNT(*)::int AS "newHires"
      FROM employee_profiles
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at);
    `);
    return rows;
  }

  // Export: Full employee report data
  async getEmployeeExportData() {
    return prisma.$queryRawUnsafe(`
      SELECT
        u.id AS "User ID",
        u.name AS "Name",
        u.email AS "Email",
        u.role AS "Role",
        ep.designation AS "Designation",
        d.department_name AS "Department",
        ep.phone AS "Phone",
        ep.salary AS "Salary",
        ep.created_at AS "Joined On"
      FROM users u
      LEFT JOIN employee_profiles ep ON ep.user_id = u.id
      LEFT JOIN departments d ON d.id = ep.department_id
      ORDER BY u.id;
    `);
  }

  // Export: Full leave report data
  async getLeaveExportData() {
    return prisma.$queryRawUnsafe(`
      SELECT
        u.name AS "Employee",
        lt.leave_name AS "Leave Type",
        la.from_date AS "From",
        la.to_date AS "To",
        la.total_days AS "Days",
        la.reason AS "Reason",
        la.status AS "Status",
        la.created_at AS "Applied On"
      FROM leave_applications la
      JOIN employee_profiles ep ON la.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
      ORDER BY la.created_at DESC;
    `);
  }
}

module.exports = new ReportRepository();
