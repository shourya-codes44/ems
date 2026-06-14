const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class LeaveRepository {
  async findUserEmployeeProfile(userId) {
    return prisma.employeeProfile.findUnique({
      where: { userId }
    });
  }

  async findLeaveBalances(employeeId) {
    return prisma.leaveBalance.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { leaveTypeId: "asc" }
    });
  }

  async findLeaveTypeById(id) {
    return prisma.leaveType.findUnique({
      where: { id }
    });
  }

  async findLeaveBalanceByDetails(employeeId, leaveTypeId) {
    return prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId }
    });
  }

  async createLeaveApplication(data) {
    return prisma.leaveApplication.create({
      data
    });
  }

  async findLeaveApplicationById(id) {
    return prisma.leaveApplication.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        leaveType: true,
        approvalHistories: {
          include: {
            user: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  async findAllLeaves() {
    return prisma.leaveApplication.findMany({
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        leaveType: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findLeavesByEmployeeId(employeeId) {
    return prisma.leaveApplication.findMany({
      where: { employeeId },
      include: {
        leaveType: true,
        approvalHistories: {
          include: {
            user: { select: { name: true, role: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async updateLeaveStatusAndLogHistory(id, status, approvedBy, remarks, action) {
    return prisma.$transaction(async (tx) => {
      // 1. Update application status
      const updatedApp = await tx.leaveApplication.update({
        where: { id },
        data: { status }
      });

      // 2. Insert approval history log
      await tx.approvalHistory.create({
        data: {
          leaveId: id,
          approvedBy,
          action,
          remarks
        }
      });

      return updatedApp;
    });
  }

  // ACID Interactive Transaction for Final HR/Admin Approval
  async executeFinalApprovalTransaction({ applicationId, employeeId, leaveTypeId, totalDays, approvedBy, remarks }) {
    return prisma.$transaction(async (tx) => {
      // 1. Update Leave Application Status to APPROVED
      const updatedApp = await tx.leaveApplication.update({
        where: { id: applicationId },
        data: { status: "APPROVED" }
      });

      // 2. Fetch current leave balance
      const balance = await tx.leaveBalance.findFirst({
        where: { employeeId, leaveTypeId }
      });

      if (!balance) {
        throw new Error("Leave balance record not found");
      }

      // Check balance limit
      if (balance.availableDays < totalDays) {
        // Throwing error causes Prisma to trigger a transaction ROLLBACK!
        throw new Error(`Insufficient leave balance. Available: ${balance.availableDays} days, Requested: ${totalDays} days.`);
      }

      // 3. Deduct available days from leave balance
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          availableDays: {
            decrement: totalDays
          }
        }
      });

      // 4. Log Approval History
      await tx.approvalHistory.create({
        data: {
          leaveId: applicationId,
          approvedBy,
          action: "APPROVED",
          remarks
        }
      });

      // 5. Create Audit Trail log
      await tx.auditLog.create({
        data: {
          tableName: "leave_applications",
          actionType: "LEAVE_FINAL_APPROVAL",
          performedBy: approvedBy,
          details: `Approved Leave Application ID: ${applicationId} for Employee ID: ${employeeId}. Deducted ${totalDays} days from Leave Type ID: ${leaveTypeId}.`
        }
      });

      return updatedApp;
    });
  }

  // Create audit log outside transaction
  async createAuditLog(actionType, performedBy, details) {
    return prisma.auditLog.create({
      data: {
        tableName: "leave_applications",
        actionType,
        performedBy,
        details
      }
    });
  }

  // Fetch recent audit logs (Restricted to Admins)
  async findAuditLogs() {
    return prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }
}

module.exports = new LeaveRepository();
