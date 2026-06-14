const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");

const prisma = new PrismaClient();

/**
 * Create employee_summary PostgreSQL VIEW
 */
const createEmployeeSummaryView = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW employee_summary AS
    SELECT
      u.id AS user_id,
      u.name,
      u.email,
      u.role,
      ep.id AS employee_id,
      ep.designation,
      ep.salary,
      ep.phone,
      ep.created_at AS joined_on,
      d.department_name,
      COUNT(DISTINCT es.id) AS skill_count,
      COUNT(DISTINCT la.id) AS total_leave_applications,
      COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'ACTIVE') AS assets_allocated
    FROM users u
    LEFT JOIN employee_profiles ep ON ep.user_id = u.id
    LEFT JOIN departments d ON d.id = ep.department_id
    LEFT JOIN employee_skills es ON es.employee_id = ep.id
    LEFT JOIN leave_applications la ON la.employee_id = ep.id
    LEFT JOIN asset_allocations aa ON aa.employee_id = ep.id
    GROUP BY u.id, u.name, u.email, u.role, ep.id, ep.designation, ep.salary, ep.phone, ep.created_at, d.department_name;
  `);
  logger.info("✅ PostgreSQL VIEW: employee_summary created/refreshed");
};

/**
 * Create calculate_leave_balance() stored function
 */
const createLeaveBalanceFunction = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION calculate_leave_balance(p_employee_id INT, p_leave_type_id INT)
    RETURNS INT AS $$
    DECLARE
      v_available INT;
      v_used INT;
    BEGIN
      SELECT available_days INTO v_available
      FROM leave_balance
      WHERE employee_id = p_employee_id AND leave_type_id = p_leave_type_id;

      IF v_available IS NULL THEN
        RETURN 0;
      END IF;

      RETURN v_available;
    END;
    $$ LANGUAGE plpgsql;
  `);
  logger.info("✅ PostgreSQL FUNCTION: calculate_leave_balance() created/refreshed");
};

/**
 * Create asset allocation audit trigger function
 */
const createAuditTrigger = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION audit_asset_change()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'UPDATE' THEN
        INSERT INTO asset_history (asset_id, action, remarks, created_by, created_at)
        VALUES (
          NEW.id,
          'STATUS_CHANGE',
          'Status changed from ' || OLD.status || ' to ' || NEW.status,
          1,
          NOW()
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger only if it doesn't exist
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_asset_audit' AND tgrelid = 'assets'::regclass
      ) THEN
        CREATE TRIGGER trg_asset_audit
        AFTER UPDATE ON assets
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION audit_asset_change();
      END IF;
    END;
    $$;
  `);
  logger.info("✅ PostgreSQL TRIGGER: trg_asset_audit created/refreshed");
};

/**
 * Seed sample assets if table is empty
 */
const seedSampleAssets = async () => {
  const count = await prisma.asset.count();
  if (count > 0) {
    logger.info("ℹ️  Assets table already seeded — skipping");
    return;
  }

  const sampleAssets = [
    { assetCode: "LAPTOP-001", assetName: "Dell XPS 15 Laptop", assetType: "Laptop", purchaseCost: 85000 },
    { assetCode: "LAPTOP-002", assetName: "HP EliteBook 840", assetType: "Laptop", purchaseCost: 72000 },
    { assetCode: "MONITOR-001", assetName: "LG 27\" 4K Monitor", assetType: "Monitor", purchaseCost: 28000 },
    { assetCode: "MONITOR-002", assetName: "Dell 24\" FHD Monitor", assetType: "Monitor", purchaseCost: 18000 },
    { assetCode: "MOUSE-001", assetName: "Logitech MX Master 3", assetType: "Peripheral", purchaseCost: 8500 },
    { assetCode: "KEYBD-001", assetName: "Mechanical Keyboard K95", assetType: "Peripheral", purchaseCost: 12000 },
    { assetCode: "PHONE-001", assetName: "iPhone 14 Pro", assetType: "Mobile Device", purchaseCost: 120000 },
    { assetCode: "CHAIR-001", assetName: "Herman Miller Aeron Chair", assetType: "Furniture", purchaseCost: 45000 },
    { assetCode: "PROJECTOR-001", assetName: "Epson Conference Projector", assetType: "AV Equipment", purchaseCost: 35000 },
    { assetCode: "ICARD-001", assetName: "Employee ID Card Printer", assetType: "Office Equipment", purchaseCost: 22000 },
  ];

  for (const asset of sampleAssets) {
    await prisma.asset.create({
      data: {
        ...asset,
        purchaseDate: new Date("2024-01-01"),
        status: "AVAILABLE",
      },
    });
  }
  logger.info(`✅ Seeded ${sampleAssets.length} sample assets`);
};

/**
 * Run all database migrations & seeds on server boot
 */
const runMigrations = async () => {
  try {
    logger.info("🔄 Running DB migrations...");
    await createEmployeeSummaryView();
    await createLeaveBalanceFunction();
    await createAuditTrigger();
    // await seedSampleAssets();
    logger.info("✅ All DB migrations completed successfully");
  } catch (error) {
    logger.error("❌ DB migrations failed:", error.message);
    // Don't crash server on migration failure
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { runMigrations };
