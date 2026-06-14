const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function test() {
  const assetCount = await p.asset.count();
  const notifCount = await p.notification.count();
  const allocCount = await p.assetAllocation.count();
  const auditCount = await p.auditLog.count();
  
  console.log("✅ DB Tables OK:");
  console.log("  Assets:", assetCount);
  console.log("  Notifications:", notifCount);
  console.log("  Asset Allocations:", allocCount);
  console.log("  Audit Logs:", auditCount);
  await p.$disconnect();
}

test().catch((e) => {
  console.error("❌ Error:", e.message);
  p.$disconnect();
});
