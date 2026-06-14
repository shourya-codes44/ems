const leaveService = require("../services/leaveService");

class LeaveController {
  async apply(req, res) {
    try {
      const { leaveTypeId, fromDate, toDate, reason } = req.body;
      const application = await leaveService.applyLeave({
        userId: req.user.id,
        leaveTypeId,
        fromDate,
        toDate,
        reason
      });

      res.status(201).json({
        message: "Leave application submitted successfully",
        application
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getBalances(req, res) {
    try {
      const balances = await leaveService.getLeaveBalances(req.user.id);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getLeaves(req, res) {
    try {
      const leaves = await leaveService.getLeaves(req.user.id, req.user.role);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async review(req, res) {
    try {
      const leaveId = parseInt(req.params.id);
      const { action, remarks } = req.body;

      const updatedApplication = await leaveService.reviewLeave({
        leaveId,
        userId: req.user.id,
        userRole: req.user.role,
        action,
        remarks
      });

      res.json({
        message: `Leave application successfully ${action.toLowerCase()}ed`,
        application: updatedApplication
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const logs = await leaveService.getAuditLogs(req.user.role);
      res.json(logs);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new LeaveController();
