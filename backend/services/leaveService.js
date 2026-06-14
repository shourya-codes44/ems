const leaveRepository = require("../repositories/leaveRepository");

class LeaveService {
  async applyLeave({ userId, leaveTypeId, fromDate, toDate, reason }) {
    // 1. Resolve employee profile
    const employee = await leaveRepository.findUserEmployeeProfile(userId);
    if (!employee) {
      throw new Error("You must have an employee profile created before applying for leave");
    }

    // 2. Validate Leave Type
    const leaveType = await leaveRepository.findLeaveTypeById(leaveTypeId);
    if (!leaveType) {
      throw new Error("Invalid leave type selected");
    }

    // Calculate total days requested
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff < 0) {
      throw new Error("End date cannot be before start date");
    }
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // 3. Verify balance availability
    const balance = await leaveRepository.findLeaveBalanceByDetails(employee.id, leaveTypeId);
    if (!balance) {
      throw new Error("Leave balance not initialized for this account");
    }

    if (balance.availableDays < totalDays) {
      throw new Error(`Insufficient leave balance. Available: ${balance.availableDays} days, Requested: ${totalDays} days.`);
    }

    // 4. Save Leave Application
    const application = await leaveRepository.createLeaveApplication({
      employeeId: employee.id,
      leaveTypeId,
      fromDate: start,
      toDate: end,
      totalDays,
      reason,
      status: "PENDING_MANAGER" // Default first step
    });

    // 5. Audit log
    await leaveRepository.createAuditLog(
      "LEAVE_APPLICATION_SUBMITTED",
      userId,
      `User ID ${userId} applied for ${totalDays} days of ${leaveType.leaveName}. Application ID: ${application.id}.`
    );

    return application;
  }

  async getLeaveBalances(userId) {
    const employee = await leaveRepository.findUserEmployeeProfile(userId);
    if (!employee) return [];
    return leaveRepository.findLeaveBalances(employee.id);
  }

  async getLeaves(userId, userRole) {
    // If admin, manager or HR, they can see all leave applications for approval workflow
    if (userRole === "admin" || userRole === "manager" || userRole === "hr") {
      return leaveRepository.findAllLeaves();
    }
    
    // Otherwise, standard employees see only their own history
    const employee = await leaveRepository.findUserEmployeeProfile(userId);
    if (!employee) return [];
    return leaveRepository.findLeavesByEmployeeId(employee.id);
  }

  async reviewLeave({ leaveId, userId, userRole, action, remarks }) {
    const application = await leaveRepository.findLeaveApplicationById(leaveId);
    if (!application) {
      throw new Error("Leave application not found");
    }

    // Business Workflow Rules
    let nextStatus = "";

    if (action === "REJECTED") {
      nextStatus = "REJECTED";
      // Save status update and log history
      const updatedApp = await leaveRepository.updateLeaveStatusAndLogHistory(
        leaveId,
        nextStatus,
        userId,
        remarks,
        "REJECTED"
      );

      await leaveRepository.createAuditLog(
        "LEAVE_APPLICATION_REJECTED",
        userId,
        `Rejected Leave Application ID: ${leaveId} by User ID: ${userId} (${userRole}).`
      );

      return updatedApp;
    }

    if (action === "APPROVED") {
      // 1. Manager Approval
      if (userRole === "manager") {
        if (application.status !== "PENDING_MANAGER") {
          throw new Error("This application is not pending manager review");
        }
        nextStatus = "PENDING_HR";
        
        const updatedApp = await leaveRepository.updateLeaveStatusAndLogHistory(
          leaveId,
          nextStatus,
          userId,
          remarks,
          "APPROVED_BY_MANAGER"
        );

        await leaveRepository.createAuditLog(
          "LEAVE_MANAGER_APPROVAL",
          userId,
          `Manager ID ${userId} approved Leave ID ${leaveId}. Shifted to PENDING_HR.`
        );

        return updatedApp;
      }

      // 2. HR or Admin Approval (Final approval - trigger transaction)
      if (userRole === "hr" || userRole === "admin") {
        if (application.status !== "PENDING_HR" && userRole === "hr") {
          throw new Error("HR can only approve applications already checked by a manager");
        }
        
        // Admins can bypass manager approvals if needed
        const approvedApp = await leaveRepository.executeFinalApprovalTransaction({
          applicationId: leaveId,
          employeeId: application.employeeId,
          leaveTypeId: application.leaveTypeId,
          totalDays: application.totalDays,
          approvedBy: userId,
          remarks
        });

        return approvedApp;
      }

      throw new Error("Your role does not possess permissions to approve leave applications");
    }

    throw new Error("Invalid review action specified");
  }

  async getAuditLogs(userRole) {
    if (userRole !== "admin") {
      throw new Error("Forbidden: Access restricted to system administrators only");
    }
    return leaveRepository.findAuditLogs();
  }
}

module.exports = new LeaveService();
