const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding process...");

  // 1. Wipe Existing Transaction and Profile Data (To avoid duplicate keys and reference issues)
  console.log("🧹 Wiping existing table data...");
  await prisma.auditLog.deleteMany({});
  await prisma.approvalHistory.deleteMany({});
  await prisma.leaveApplication.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.employeeSkill.deleteMany({});
  await prisma.employeeImage.deleteMany({});
  await prisma.assetAllocation.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Tables wiped cleanly.");

  // 2. Seed / Resolve Departments
  console.log("💼 Seeding Departments...");
  const departmentsData = ["IT", "HR", "Finance", "Marketing"];
  const departments = {};
  for (const name of departmentsData) {
    let dept = await prisma.department.findFirst({ where: { departmentName: name } });
    if (!dept) {
      dept = await prisma.department.create({ data: { departmentName: name } });
    }
    departments[name] = dept.id;
  }
  console.log("   Departments loaded:", departments);

  // 3. Seed / Resolve Skills
  console.log("🛠️ Seeding Skills...");
  const skillsData = ["React", "NodeJS", "PostgreSQL", "Python", "Java", "Docker", "AWS", "TypeScript"];
  const skills = {};
  for (const name of skillsData) {
    let skill = await prisma.skill.findFirst({ where: { skillName: name } });
    if (!skill) {
      skill = await prisma.skill.create({ data: { skillName: name } });
    }
    skills[name] = skill.id;
  }
  console.log("   Skills loaded:", Object.keys(skills).join(", "));

  // 4. Seed / Resolve Leave Types
  console.log("🌴 Seeding Leave Types...");
  const leaveTypesData = [
    { name: "Casual Leave", days: 10 },
    { name: "Sick Leave", days: 10 },
    { name: "Earned Leave", days: 15 },
    { name: "Maternity Leave", days: 90 }
  ];
  const leaveTypes = {};
  for (const lt of leaveTypesData) {
    let leaveType = await prisma.leaveType.findFirst({ where: { leaveName: lt.name } });
    if (!leaveType) {
      leaveType = await prisma.leaveType.create({ data: { leaveName: lt.name, totalDays: lt.days } });
    }
    leaveTypes[lt.name] = { id: leaveType.id, totalDays: leaveType.totalDays };
  }
  console.log("   Leave Types loaded:", Object.keys(leaveTypes).join(", "));

  // 5. Seed Users & Passwords
  console.log("🔐 Generating password hashes...");
  const salt = await bcrypt.genSalt(10);
  const userPasswordHash = await bcrypt.hash("password123", salt);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  console.log("👤 Seeding User Accounts...");
  const usersToSeed = [
    { name: "System Admin", email: "admin@ems.com", password: adminPasswordHash, role: "admin" },
    { name: "Sarah Jenkins", email: "hr@ems.com", password: userPasswordHash, role: "hr" },
    { name: "Michael Scott", email: "manager.it@ems.com", password: userPasswordHash, role: "manager" },
    { name: "Oscar Martinez", email: "manager.finance@ems.com", password: userPasswordHash, role: "manager" },
    { name: "Alice Smith", email: "alice@ems.com", password: userPasswordHash, role: "user" },
    { name: "Bob Johnson", email: "bob@ems.com", password: userPasswordHash, role: "user" },
    { name: "Carol Williams", email: "carol@ems.com", password: userPasswordHash, role: "user" },
    { name: "David Brown", email: "david@ems.com", password: userPasswordHash, role: "user" },
    { name: "Eva Davis", email: "eva@ems.com", password: userPasswordHash, role: "user" }
  ];

  const seededUsers = {};
  for (const u of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        verified: true
      }
    });
    seededUsers[u.email] = user;
    console.log(`   Created User: ${user.name} (${user.email}) [Role: ${user.role}]`);
  }

  // 6. Seeding Employee Profiles
  console.log("💼 Seeding Employee Profiles...");
  const profilesToSeed = [
    {
      email: "admin@ems.com",
      dept: "IT",
      designation: "System Administrator",
      salary: 150000.00,
      phone: "+1 555 123-4567",
      address: "123 Admin HQ, System City",
      assignedSkills: ["NodeJS", "Docker", "AWS"]
    },
    {
      email: "hr@ems.com",
      dept: "HR",
      designation: "HR Director",
      salary: 110000.00,
      phone: "+1 555 234-5678",
      address: "456 Oak Avenue, HR Division",
      assignedSkills: []
    },
    {
      email: "manager.it@ems.com",
      dept: "IT",
      designation: "Engineering Manager",
      salary: 130000.00,
      phone: "+1 555 345-6789",
      address: "789 Pine Road, Scranton",
      assignedSkills: ["React", "NodeJS", "PostgreSQL", "TypeScript"]
    },
    {
      email: "manager.finance@ems.com",
      dept: "Finance",
      designation: "Finance Manager",
      salary: 125000.00,
      phone: "+1 555 456-7890",
      address: "101 Maple Street, Wealth Town",
      assignedSkills: []
    },
    {
      email: "alice@ems.com",
      dept: "IT",
      designation: "Software Engineer",
      salary: 85000.00,
      phone: "+1 555 567-8901",
      address: "202 Birch Lane, Tech Ville",
      assignedSkills: ["React", "NodeJS", "TypeScript"]
    },
    {
      email: "bob@ems.com",
      dept: "IT",
      designation: "Senior React Developer",
      salary: 95000.00,
      phone: "+1 555 678-9012",
      address: "303 Cedar Street, Frontend City",
      assignedSkills: ["React", "TypeScript", "AWS"]
    },
    {
      email: "carol@ems.com",
      dept: "HR",
      designation: "HR Recruiter",
      salary: 65000.00,
      phone: "+1 555 789-0123",
      address: "404 Elm Drive, People City",
      assignedSkills: []
    },
    {
      email: "david@ems.com",
      dept: "Finance",
      designation: "Financial Analyst",
      salary: 78000.00,
      phone: "+1 555 890-1234",
      address: "505 Willow Court, Ledger Town",
      assignedSkills: ["Python", "PostgreSQL"]
    },
    {
      email: "eva@ems.com",
      dept: "Marketing",
      designation: "Marketing Specialist",
      salary: 70000.00,
      phone: "+1 555 901-2345",
      address: "606 Cherry Way, Promo Town",
      assignedSkills: []
    }
  ];

  const seededProfiles = {};
  for (const p of profilesToSeed) {
    const user = seededUsers[p.email];
    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        departmentId: departments[p.dept],
        phone: p.phone,
        address: p.address,
        designation: p.designation,
        salary: p.salary,
        createdAt: new Date("2025-01-15T09:00:00Z"),
        skills: {
          create: p.assignedSkills.map(skillName => ({
            skill: { connect: { id: skills[skillName] } }
          }))
        }
      }
    });

    seededProfiles[p.email] = profile;
    console.log(`   Created Employee Profile for ${user.name} (Profile ID: ${profile.id})`);

    // Initialize leave balance records for this employee
    for (const name of Object.keys(leaveTypes)) {
      const lt = leaveTypes[name];
      await prisma.leaveBalance.create({
        data: {
          employeeId: profile.id,
          leaveTypeId: lt.id,
          availableDays: lt.totalDays
        }
      });
    }
  }

  // 7. Seed Assets
  console.log("💼 Seeding Assets inventory...");
  const assetsToSeed = [
    { assetCode: "LAPTOP-001", assetName: "Dell XPS 15 Laptop", assetType: "Laptop", purchaseCost: 85000, status: "ALLOCATED" },
    { assetCode: "LAPTOP-002", assetName: "HP EliteBook 840", assetType: "Laptop", purchaseCost: 72000, status: "ALLOCATED" },
    { assetCode: "LAPTOP-003", assetName: "MacBook Pro 16\"", assetType: "Laptop", purchaseCost: 180000, status: "ALLOCATED" },
    { assetCode: "MONITOR-001", assetName: "LG 27\" 4K Monitor", assetType: "Monitor", purchaseCost: 28000, status: "AVAILABLE" },
    { assetCode: "MONITOR-002", assetName: "Dell 24\" FHD Monitor", assetType: "Monitor", purchaseCost: 18000, status: "AVAILABLE" },
    { assetCode: "MOUSE-001", assetName: "Logitech MX Master 3", assetType: "Peripheral", purchaseCost: 8500, status: "AVAILABLE" },
    { assetCode: "KEYBD-001", assetName: "Mechanical Keyboard K95", assetType: "Peripheral", purchaseCost: 12000, status: "AVAILABLE" },
    { assetCode: "PHONE-001", assetName: "iPhone 14 Pro", assetType: "Mobile Device", purchaseCost: 120000, status: "ALLOCATED" },
    { assetCode: "CHAIR-001", assetName: "Herman Miller Aeron Chair", assetType: "Furniture", purchaseCost: 45000, status: "ALLOCATED" },
    { assetCode: "PROJECTOR-001", assetName: "Epson Conference Projector", assetType: "AV Equipment", purchaseCost: 35000, status: "AVAILABLE" },
    { assetCode: "ICARD-001", assetName: "Employee ID Card Printer", assetType: "Office Equipment", purchaseCost: 22000, status: "AVAILABLE" },
    { assetCode: "DESK-001", assetName: "Adjustable Standing Desk", assetType: "Furniture", purchaseCost: 30000, status: "AVAILABLE" }
  ];

  const seededAssets = {};
  for (const a of assetsToSeed) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        purchaseDate: new Date("2025-02-01"),
        purchaseCost: a.purchaseCost,
        status: a.status
      }
    });
    seededAssets[a.assetCode] = asset;
  }
  console.log(`   Seeded ${assetsToSeed.length} assets successfully.`);

  // 8. Seed Asset Allocations
  console.log("🔗 Seeding Asset Allocations...");
  const allocations = [
    { assetCode: "LAPTOP-001", employeeEmail: "alice@ems.com", allocatedByEmail: "admin@ems.com" },
    { assetCode: "LAPTOP-002", employeeEmail: "bob@ems.com", allocatedByEmail: "admin@ems.com" },
    { assetCode: "LAPTOP-003", employeeEmail: "manager.it@ems.com", allocatedByEmail: "admin@ems.com" },
    { assetCode: "PHONE-001", employeeEmail: "hr@ems.com", allocatedByEmail: "admin@ems.com" },
    { assetCode: "CHAIR-001", employeeEmail: "manager.finance@ems.com", allocatedByEmail: "admin@ems.com" }
  ];

  for (const alloc of allocations) {
    const asset = seededAssets[alloc.assetCode];
    const employee = seededProfiles[alloc.employeeEmail];
    const adminUser = seededUsers[alloc.allocatedByEmail];

    const allocation = await prisma.assetAllocation.create({
      data: {
        assetId: asset.id,
        employeeId: employee.id,
        allocatedBy: adminUser.id,
        allocatedDate: new Date("2025-02-10T10:00:00Z"),
        status: "ACTIVE"
      }
    });

    // Write to asset history
    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        action: "STATUS_CHANGE",
        remarks: `Allocated to Employee Profile ID ${employee.id} by Admin ID ${adminUser.id}`,
        createdBy: adminUser.id,
        createdAt: new Date("2025-02-10T10:00:00Z")
      }
    });

    // Notification to user
    const empUser = seededUsers[alloc.employeeEmail];
    await prisma.notification.create({
      data: {
        userId: empUser.id,
        title: "Asset Allocated",
        message: `${asset.assetName} (${asset.assetCode}) has been allocated to you by ${adminUser.name}.`,
        eventType: "ASSET_ALLOCATED",
        isRead: false
      }
    });
  }
  console.log("   Asset allocations seeded.");

  // 9. Seed Leave Applications & Workflows
  console.log("🌴 Seeding Leave Applications & Workflows...");

  // Leave 1: Alice (IT employee) - Casual Leave, Approved
  const aliceProfile = seededProfiles["alice@ems.com"];
  const aliceUser = seededUsers["alice@ems.com"];
  const itManagerUser = seededUsers["manager.it@ems.com"];
  const hrManagerUser = seededUsers["hr@ems.com"];
  const adminUser = seededUsers["admin@ems.com"];

  const leave1 = await prisma.leaveApplication.create({
    data: {
      employeeId: aliceProfile.id,
      leaveTypeId: leaveTypes["Casual Leave"].id,
      fromDate: new Date("2026-05-10T00:00:00Z"),
      toDate: new Date("2026-05-12T23:59:59Z"),
      totalDays: 3,
      reason: "Family trip to the mountains",
      status: "APPROVED"
    }
  });

  // Deduct from leave balance
  const aliceBalanceCasual = await prisma.leaveBalance.findFirst({
    where: { employeeId: aliceProfile.id, leaveTypeId: leaveTypes["Casual Leave"].id }
  });
  await prisma.leaveBalance.update({
    where: { id: aliceBalanceCasual.id },
    data: { availableDays: aliceBalanceCasual.availableDays - 3 }
  });

  // Approval histories
  await prisma.approvalHistory.create({
    data: {
      leaveId: leave1.id,
      approvedBy: itManagerUser.id,
      action: "APPROVED_BY_MANAGER",
      remarks: "Approved, have a safe trip!"
    }
  });
  await prisma.approvalHistory.create({
    data: {
      leaveId: leave1.id,
      approvedBy: hrManagerUser.id,
      action: "APPROVED",
      remarks: "Final approval granted"
    }
  });

  // Leave 2: Bob (IT employee) - Sick Leave, Approved
  const bobProfile = seededProfiles["bob@ems.com"];
  const bobUser = seededUsers["bob@ems.com"];
  const leave2 = await prisma.leaveApplication.create({
    data: {
      employeeId: bobProfile.id,
      leaveTypeId: leaveTypes["Sick Leave"].id,
      fromDate: new Date("2026-06-01T00:00:00Z"),
      toDate: new Date("2026-06-02T23:59:59Z"),
      totalDays: 2,
      reason: "Dental checkup and minor surgery",
      status: "APPROVED"
    }
  });

  const bobBalanceSick = await prisma.leaveBalance.findFirst({
    where: { employeeId: bobProfile.id, leaveTypeId: leaveTypes["Sick Leave"].id }
  });
  await prisma.leaveBalance.update({
    where: { id: bobBalanceSick.id },
    data: { availableDays: bobBalanceSick.availableDays - 2 }
  });

  await prisma.approvalHistory.create({
    data: {
      leaveId: leave2.id,
      approvedBy: itManagerUser.id,
      action: "APPROVED_BY_MANAGER",
      remarks: "Get well soon!"
    }
  });
  await prisma.approvalHistory.create({
    data: {
      leaveId: leave2.id,
      approvedBy: hrManagerUser.id,
      action: "APPROVED",
      remarks: "Approved"
    }
  });

  // Leave 3: David (Finance employee) - Casual Leave, PENDING_MANAGER (Pending Finance Manager review)
  const davidProfile = seededProfiles["david@ems.com"];
  const davidUser = seededUsers["david@ems.com"];
  const finManagerUser = seededUsers["manager.finance@ems.com"];
  
  await prisma.leaveApplication.create({
    data: {
      employeeId: davidProfile.id,
      leaveTypeId: leaveTypes["Casual Leave"].id,
      fromDate: new Date("2026-06-20T00:00:00Z"),
      toDate: new Date("2026-06-22T23:59:59Z"),
      totalDays: 3,
      reason: "Personal work at hometown",
      status: "PENDING_MANAGER"
    }
  });

  // Notify manager about pending leave
  await prisma.notification.create({
    data: {
      userId: finManagerUser.id,
      title: "Leave Request Submitted",
      message: `${davidUser.name} has submitted a request for 3 days of Casual Leave. Please review it.`,
      eventType: "LEAVE_APPLIED",
      isRead: false
    }
  });

  // Leave 4: Carol (HR employee) - Sick Leave, PENDING_HR (Approved by Manager Sarah Jenkins, pending final HR check)
  const carolProfile = seededProfiles["carol@ems.com"];
  const carolUser = seededUsers["carol@ems.com"];
  const leave4 = await prisma.leaveApplication.create({
    data: {
      employeeId: carolProfile.id,
      leaveTypeId: leaveTypes["Sick Leave"].id,
      fromDate: new Date("2026-06-12T00:00:00Z"),
      toDate: new Date("2026-06-13T23:59:59Z"),
      totalDays: 2,
      reason: "Fever and cold",
      status: "PENDING_HR"
    }
  });

  await prisma.approvalHistory.create({
    data: {
      leaveId: leave4.id,
      approvedBy: hrManagerUser.id, // Approved in capacity of manager
      action: "APPROVED_BY_MANAGER",
      remarks: "Approved. Take rest."
    }
  });

  // Notify HR about final check
  await prisma.notification.create({
    data: {
      userId: hrManagerUser.id,
      title: "Leave Final Review Required",
      message: `${carolUser.name}'s Sick Leave application is approved by manager, pending final HR check.`,
      eventType: "LEAVE_APPLIED",
      isRead: false
    }
  });

  // Leave 5: Eva (Marketing employee) - Earned Leave, Rejected by System Admin
  const evaProfile = seededProfiles["eva@ems.com"];
  const evaUser = seededUsers["eva@ems.com"];
  
  const leave5 = await prisma.leaveApplication.create({
    data: {
      employeeId: evaProfile.id,
      leaveTypeId: leaveTypes["Earned Leave"].id,
      fromDate: new Date("2026-04-01T00:00:00Z"),
      toDate: new Date("2026-04-10T23:59:59Z"),
      totalDays: 10,
      reason: "Long vacation with family",
      status: "REJECTED"
    }
  });

  await prisma.approvalHistory.create({
    data: {
      leaveId: leave5.id,
      approvedBy: adminUser.id,
      action: "REJECTED",
      remarks: "Sorry, too many marketing campaigns scheduled for this week. Please reschedule."
    }
  });

  // Notification to employee about rejection
  await prisma.notification.create({
    data: {
      userId: evaUser.id,
      title: "Leave Application Rejected",
      message: `Your request for 10 days of Earned Leave has been rejected by ${adminUser.name}. Remarks: Sorry, too many marketing campaigns scheduled for this week. Please reschedule.`,
      eventType: "LEAVE_REJECTED",
      isRead: false
    }
  });

  console.log("   Leave workflows and balance deductions seeded successfully.");

  // 10. Audit Logging
  console.log("📝 Seeding Audit Logs...");
  const auditLogs = [
    { tableName: "users", actionType: "USER_SIGNUP", details: "User alice@ems.com registered and verified.", performedBy: adminUser.id },
    { tableName: "users", actionType: "USER_SIGNUP", details: "User bob@ems.com registered and verified.", performedBy: adminUser.id },
    { tableName: "employee_profiles", actionType: "PROFILE_CREATE", details: "Created employee profile for Alice Smith.", performedBy: adminUser.id },
    { tableName: "employee_profiles", actionType: "PROFILE_CREATE", details: "Created employee profile for Bob Johnson.", performedBy: adminUser.id },
    { tableName: "assets", actionType: "CREATE", details: "Created asset LAPTOP-001 (Dell XPS 15 Laptop)", performedBy: adminUser.id },
    { tableName: "asset_allocations", actionType: "ALLOCATE", details: "Asset LAPTOP-001 allocated to employee Alice Smith", performedBy: adminUser.id },
    { tableName: "leave_applications", actionType: "LEAVE_APPLICATION_SUBMITTED", details: "Alice Smith applied for 3 days of Casual Leave", performedBy: aliceUser.id },
    { tableName: "leave_applications", actionType: "LEAVE_FINAL_APPROVAL", details: "Approved Leave Application ID: 1 for Alice Smith. Deducted 3 days from Casual Leave", performedBy: hrManagerUser.id }
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log
    });
  }
  console.log("   Audit logs seeded.");

  console.log("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🎉");
  console.log("==================================================================");
  console.log("Credentials seeded:");
  for (const u of usersToSeed) {
    console.log(`- ${u.name.padEnd(20)} | Email: ${u.email.padEnd(25)} | Password: ${u.email === "admin@ems.com" ? "admin123" : "password123"} (${u.role})`);
  }
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
