const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── ASSET CRUD ──────────────────────────────────────────────────────────────

const getAllAssets = async ({ page = 1, limit = 10, status, type, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(type && { assetType: type }),
    ...(search && {
      OR: [
        { assetName: { contains: search, mode: "insensitive" } },
        { assetCode: { contains: search, mode: "insensitive" } },
        { assetType: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            employee: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return { assets, total, page: Number(page), limit: Number(limit) };
};

const getAssetById = async (id) => {
  return prisma.asset.findUnique({
    where: { id: Number(id) },
    include: {
      allocations: {
        include: {
          employee: { include: { user: { select: { name: true } } } },
          allocatedByUser: { select: { name: true } },
        },
        orderBy: { allocatedDate: "desc" },
      },
      history: { orderBy: { createdAt: "desc" } },
    },
  });
};

const createAsset = async (data) => {
  return prisma.asset.create({ data });
};

const updateAsset = async (id, data) => {
  return prisma.asset.update({ where: { id: Number(id) }, data });
};

const deleteAsset = async (id) => {
  return prisma.asset.update({
    where: { id: Number(id) },
    data: { status: "LOST" },
  });
};

// ─── ALLOCATION ───────────────────────────────────────────────────────────────

const allocateAsset = async (assetId, employeeId, allocatedBy) => {
  return prisma.$transaction(async (tx) => {
    // Lock and update asset status
    await tx.asset.update({
      where: { id: assetId },
      data: { status: "ALLOCATED" },
    });

    // Create allocation record
    const allocation = await tx.assetAllocation.create({
      data: { assetId, employeeId, allocatedBy, status: "ACTIVE" },
      include: {
        asset: true,
        employee: { include: { user: { select: { name: true } } } },
      },
    });

    // Log history
    await tx.assetHistory.create({
      data: {
        assetId,
        action: "ALLOCATED",
        remarks: `Allocated to employee ID ${employeeId}`,
        createdBy: allocatedBy,
      },
    });

    return allocation;
  });
};

const returnAsset = async (assetId, returnedBy) => {
  return prisma.$transaction(async (tx) => {
    // Find active allocation
    const allocation = await tx.assetAllocation.findFirst({
      where: { assetId, status: "ACTIVE" },
    });

    if (!allocation) throw new Error("No active allocation found for this asset");

    // Close allocation
    await tx.assetAllocation.update({
      where: { id: allocation.id },
      data: { status: "RETURNED", returnDate: new Date() },
    });

    // Update asset status
    await tx.asset.update({
      where: { id: assetId },
      data: { status: "AVAILABLE" },
    });

    // Log history
    await tx.assetHistory.create({
      data: {
        assetId,
        action: "RETURNED",
        remarks: `Returned by user ID ${returnedBy}`,
        createdBy: returnedBy,
      },
    });

    return allocation;
  });
};

// ─── HISTORY ──────────────────────────────────────────────────────────────────

const getAssetHistory = async (assetId) => {
  return prisma.assetHistory.findMany({
    where: { assetId: Number(assetId) },
    orderBy: { createdAt: "desc" },
  });
};

// ─── STATS ────────────────────────────────────────────────────────────────────

const getAssetStats = async () => {
  const stats = await prisma.asset.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const total = await prisma.asset.count();

  return {
    total,
    byStatus: stats.map((s) => ({ status: s.status, count: s._count.id })),
  };
};

const getAllAssetsForExport = async () => {
  return prisma.asset.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      allocations: {
        where: { status: "ACTIVE" },
        include: { employee: { include: { user: { select: { name: true } } } } },
      },
    },
  });
};

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
  getAssetHistory,
  getAssetStats,
  getAllAssetsForExport,
};
