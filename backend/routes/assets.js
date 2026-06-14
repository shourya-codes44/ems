const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const assetCtrl = require("../controllers/assetController");

// All routes require authentication
router.use(auth);

// GET /api/assets           - list with pagination + filtering + optional export
router.get("/", assetCtrl.listAssets);

// GET /api/assets/stats     - status breakdown stats
router.get("/stats", assetCtrl.getStats);

// GET /api/assets/:id       - single asset detail + history
router.get("/:id", assetCtrl.getAsset);

// POST /api/assets          - create new asset (admin/hr only)
router.post("/", rbac(["admin", "hr"]), assetCtrl.createAsset);

// PUT /api/assets/:id       - update asset (admin/hr only)
router.put("/:id", rbac(["admin", "hr"]), assetCtrl.updateAsset);

// DELETE /api/assets/:id    - mark as LOST (admin only)
router.delete("/:id", rbac(["admin"]), assetCtrl.deleteAsset);

// POST /api/assets/:id/allocate  - allocate to employee
router.post("/:id/allocate", rbac(["admin", "hr"]), assetCtrl.allocateAsset);

// POST /api/assets/:id/return    - return asset
router.post("/:id/return", rbac(["admin", "hr"]), assetCtrl.returnAsset);

// GET /api/assets/:id/history    - asset audit history
router.get("/:id/history", assetCtrl.getHistory);

module.exports = router;
