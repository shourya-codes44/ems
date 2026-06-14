const http = require("http");

const BASE = "http://localhost:5000/api";
let token = "";

function request(method, path, body = null, authToken = "") {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    };

    const url = new URL(BASE + path);
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log("\n=== DAY 5 API VERIFICATION TESTS ===\n");

  // Test 1: Login as admin
  console.log("1. 🔐 Admin Login...");
  const login = await request("POST", "/auth/login", {
    email: "admin@ems.com",
    password: "admin123",
  });
  if (login.status === 200 && login.body.accessToken) {
    token = login.body.accessToken;
    console.log("   ✅ Login OK — Token received");
  } else {
    console.log("   ❌ Login FAILED:", login.body);
    return;
  }

  // Test 2: Get Assets List
  console.log("\n2. 💼 GET /api/assets...");
  const assets = await request("GET", "/assets?page=1&limit=5", null, token);
  if (assets.status === 200 && assets.body.assets) {
    console.log(`   ✅ Assets loaded — Total: ${assets.body.total}, Page: ${assets.body.page}`);
    console.log(`   First asset: ${assets.body.assets[0]?.assetName} [${assets.body.assets[0]?.status}]`);
  } else {
    console.log("   ❌ Assets FAILED:", assets.body?.message || assets.status);
  }

  // Test 3: Get Asset Stats
  console.log("\n3. 📊 GET /api/assets/stats...");
  const stats = await request("GET", "/assets/stats", null, token);
  if (stats.status === 200 && stats.body.data) {
    console.log(`   ✅ Asset Stats — Total: ${stats.body.data.total}`);
    console.log("   By Status:", stats.body.data.byStatus.map(s => `${s.status}:${s.count}`).join(", "));
  } else {
    console.log("   ❌ Stats FAILED:", stats.body?.message || stats.status);
  }

  // Test 4: Create Asset
  console.log("\n4. ➕ POST /api/assets (create)...");
  const create = await request("POST", "/assets", {
    assetCode: "TEST-001",
    assetName: "Test Laptop",
    assetType: "Laptop",
    purchaseCost: 50000,
    status: "AVAILABLE",
  }, token);
  if (create.status === 201) {
    const assetId = create.body.data?.id;
    console.log(`   ✅ Asset Created — ID: ${assetId}`);

    // Test 5: Get asset history
    console.log("\n5. 📜 GET /api/assets/:id/history...");
    const hist = await request("GET", `/assets/${assetId}/history`, null, token);
    if (hist.status === 200) {
      console.log(`   ✅ History endpoint OK — ${hist.body.data?.length} records`);
    } else {
      console.log("   ❌ History FAILED:", hist.body?.message);
    }
  } else {
    console.log("   ❌ Create FAILED:", create.body?.message || create.status);
  }

  // Test 6: Notifications (unread count)
  console.log("\n6. 🔔 GET /api/notifications/unread-count...");
  const notifs = await request("GET", "/notifications/unread-count", null, token);
  if (notifs.status === 200) {
    console.log(`   ✅ Notifications OK — Unread count: ${notifs.body.count}`);
  } else {
    console.log("   ❌ Notifications FAILED:", notifs.body?.message);
  }

  // Test 7: Global Search
  console.log("\n7. 🔍 GET /api/search?q=admin...");
  const search = await request("GET", "/search?q=admin", null, token);
  if (search.status === 200 && search.body.results) {
    console.log(`   ✅ Search OK — Employees: ${search.body.results.employees?.length}, Depts: ${search.body.results.departments?.length}`);
  } else {
    console.log("   ❌ Search FAILED:", search.body?.message);
  }

  // Test 8: Dashboard Stats
  console.log("\n8. 📈 GET /api/reports/stats...");
  const dashStats = await request("GET", "/reports/stats", null, token);
  if (dashStats.status === 200 && dashStats.body.employees !== undefined) {
    console.log(`   ✅ Dashboard Stats — Employees: ${dashStats.body.employees}, Departments: ${dashStats.body.departments}`);
  } else {
    console.log("   ❌ Dashboard Stats FAILED:", dashStats.body?.message);
  }

  // Test 9: Department Chart Data
  console.log("\n9. 📊 GET /api/reports/department-stats...");
  const deptStats = await request("GET", "/reports/department-stats", null, token);
  if (deptStats.status === 200 && Array.isArray(deptStats.body)) {
    console.log(`   ✅ Dept Stats Chart OK — ${deptStats.body.length} departments`);
  } else {
    console.log("   ❌ Dept Stats FAILED:", deptStats.body?.message || deptStats.status);
  }

  // Test 10: Hiring Trend
  console.log("\n10. 📈 GET /api/reports/hiring-trend...");
  const hiring = await request("GET", "/reports/hiring-trend", null, token);
  if (hiring.status === 200) {
    console.log(`   ✅ Hiring Trend OK — ${hiring.body.length} months of data`);
  } else {
    console.log("   ❌ Hiring Trend FAILED:", hiring.body?.message);
  }

  console.log("\n=== VERIFICATION COMPLETE ===\n");
}

runTests().catch(console.error);
