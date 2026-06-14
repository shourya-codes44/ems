const assetRepo = require("../repositories/assetRepository");
const notifRepo = require("../repositories/notificationRepository");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const writeAuditLog = async (performedBy, tableName, actionType, recordId, oldData, newData, details) => {
  try {
    await prisma.auditLog.create({
      data: {
        tableName,
        actionType,
        recordId,
        oldData: oldData || undefined,
        newData: newData || undefined,
        performedBy,
        details,
      },
    });
  } catch (err) {
    logger.error("Audit log write failed: " + err.message);
  }
};

// ─── ASSET SERVICE ────────────────────────────────────────────────────────────

const listAssets = async (query) => {
  return assetRepo.getAllAssets(query);
};

const getAsset = async (id) => {
  const asset = await assetRepo.getAssetById(id);
  if (!asset) throw { statusCode: 404, message: "Asset not found" };
  return asset;
};

const createAsset = async (data, performedBy) => {
  const asset = await assetRepo.createAsset(data);
  await writeAuditLog(performedBy, "assets", "CREATE", asset.id, null, asset, `Created asset: ${asset.assetCode}`);
  logger.info(`Asset created: ${asset.assetCode} by user ${performedBy}`);
  return asset;
};

const updateAsset = async (id, data, performedBy) => {
  const old = await assetRepo.getAssetById(id);
  if (!old) throw { statusCode: 404, message: "Asset not found" };

  const updated = await assetRepo.updateAsset(id, data);
  await writeAuditLog(performedBy, "assets", "UPDATE", Number(id), old, updated, `Updated asset: ${old.assetCode}`);
  logger.info(`Asset updated: ${old.assetCode} by user ${performedBy}`);
  return updated;
};

const deleteAsset = async (id, performedBy) => {
  const old = await assetRepo.getAssetById(id);
  if (!old) throw { statusCode: 404, message: "Asset not found" };

  const updated = await assetRepo.deleteAsset(id);
  await writeAuditLog(performedBy, "assets", "DELETE", Number(id), old, null, `Marked asset as LOST: ${old.assetCode}`);
  logger.info(`Asset marked LOST: ${old.assetCode} by user ${performedBy}`);
  return updated;
};

const allocateAsset = async (assetId, employeeId, performedBy) => {
  // Validate asset is available
  const asset = await assetRepo.getAssetById(assetId);
  if (!asset) throw { statusCode: 404, message: "Asset not found" };
  if (asset.status !== "AVAILABLE") {
    throw { statusCode: 400, message: `Asset is not available. Current status: ${asset.status}` };
  }

  // Validate employee exists
  const employee = await prisma.employeeProfile.findUnique({
    where: { id: Number(employeeId) },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!employee) throw { statusCode: 404, message: "Employee profile not found" };

  const allocation = await assetRepo.allocateAsset(
    Number(assetId),
    Number(employeeId),
    Number(performedBy)
  );

  // Send notification to employee's user account
  await notifRepo.createNotification(
    employee.user.id,
    "Asset Allocated to You",
    `${asset.assetName} (${asset.assetCode}) has been allocated to you.`,
    "ASSET_ALLOCATED"
  );

  await writeAuditLog(
    performedBy, "asset_allocations", "ALLOCATE",
    allocation.id, null, allocation,
    `Asset ${asset.assetCode} allocated to employee ${employee.user.name}`
  );

  logger.info(`Asset ${asset.assetCode} allocated to employee ${employeeId} by user ${performedBy}`);
  return allocation;
};

const returnAsset = async (assetId, performedBy) => {
  const asset = await assetRepo.getAssetById(assetId);
  if (!asset) throw { statusCode: 404, message: "Asset not found" };

  const allocation = await assetRepo.returnAsset(Number(assetId), Number(performedBy));

  // Find employee user ID for notification
  const employee = await prisma.employeeProfile.findUnique({
    where: { id: allocation.employeeId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (employee) {
    await notifRepo.createNotification(
      employee.user.id,
      "Asset Return Confirmed",
      `${asset.assetName} (${asset.assetCode}) has been successfully returned.`,
      "ASSET_RETURNED"
    );
  }

  await writeAuditLog(
    performedBy, "asset_allocations", "RETURN",
    allocation.id, { status: "ACTIVE" }, { status: "RETURNED" },
    `Asset ${asset.assetCode} returned`
  );

  logger.info(`Asset ${asset.assetCode} returned by user ${performedBy}`);
  return allocation;
};

const getAssetHistory = async (assetId) => {
  const history = await assetRepo.getAssetHistory(assetId);
  return history;
};

const getAssetStats = async () => {
  return assetRepo.getAssetStats();
};

const getAllAssetsForExport = async () => {
  return assetRepo.getAllAssetsForExport();
};

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
  getAssetHistory,
  getAssetStats,
  getAllAssetsForExport,
};
