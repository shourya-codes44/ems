const assetService = require("../services/assetService");
const { generateExcel, generateCSV, sendFile } = require("../utils/exporter");

const listAssets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type, search, export: exportType } = req.query;

    if (exportType) {
      const allAssets = await assetService.getAllAssetsForExport();
      const exportData = allAssets.map((a) => ({
        "Asset Code": a.assetCode,
        "Asset Name": a.assetName,
        "Type": a.assetType,
        "Status": a.status,
        "Purchase Cost (₹)": a.purchaseCost ? Number(a.purchaseCost) : "N/A",
        "Purchase Date": a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : "N/A",
        "Allocated To": a.allocations[0]?.employee?.user?.name || "—",
      }));

      if (exportType === "csv") {
        return sendFile(res, generateCSV(exportData), "asset-report.csv", "text/csv");
      }
      return sendFile(res, generateExcel(exportData, "Assets"), "asset-report.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    const result = await assetService.listAssets({ page, limit, status, type, search });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAsset = async (req, res, next) => {
  try {
    const asset = await assetService.getAsset(req.params.id);
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Asset created successfully", data: asset });
  } catch (err) {
    next(err);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: "Asset updated successfully", data: asset });
  } catch (err) {
    next(err);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id, req.user.id);
    res.json({ success: true, message: "Asset marked as LOST" });
  } catch (err) {
    next(err);
  }
};

const allocateAsset = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

    const allocation = await assetService.allocateAsset(req.params.id, employeeId, req.user.id);
    res.status(201).json({ success: true, message: "Asset allocated successfully", data: allocation });
  } catch (err) {
    next(err);
  }
};

const returnAsset = async (req, res, next) => {
  try {
    const result = await assetService.returnAsset(req.params.id, req.user.id);
    res.json({ success: true, message: "Asset returned successfully", data: result });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await assetService.getAssetHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await assetService.getAssetStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
  getHistory,
  getStats,
};
