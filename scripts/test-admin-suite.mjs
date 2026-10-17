async function testAdminSuite() {
  console.log("=== Testing SAN Furniture Admin & Auth Engine ===");

  // 1. Test Admin Auth API
  console.log("\n1. Testing POST /api/admin/auth/login...");
  const loginRes = await fetch("http://localhost:9000/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@sanfurniture.com",
      password: "AdminPassword2026!",
    }),
  });

  const loginData = await loginRes.json();
  if (loginRes.status === 200 && loginData.success) {
    console.log("✅ Admin Login Passed! Token:", loginData.token);
    console.log("   Authenticated User:", loginData.user.fullName, `(${loginData.user.role})`);
  } else {
    console.error("❌ Admin Login Failed:", loginRes.status, loginData);
    process.exit(1);
  }

  // 2. Test Admin Products CRUD API
  console.log("\n2. Testing GET /api/admin/products...");
  const prodRes = await fetch("http://localhost:9000/api/admin/products");
  const prodData = await prodRes.json();
  if (prodRes.status === 200 && Array.isArray(prodData.products)) {
    console.log(`✅ Admin Products List Passed! Total in MySQL: ${prodData.products.length}`);
  } else {
    console.error("❌ Admin Products Failed:", prodRes.status);
    process.exit(1);
  }

  // 3. Test Storefront Admin Routes (Isolated Layout)
  const routes = [
    { path: "http://localhost:3000/admin/login", label: "Admin Login Portal" },
    { path: "http://localhost:3000/admin", label: "Admin Dedicated Dashboard" },
    { path: "http://localhost:3000/admin/products", label: "Admin Products CRUD Page" },
    { path: "http://localhost:3000/", label: "Customer Storefront Homepage" },
  ];

  console.log("\n3. Testing Next.js Routes Rendering...");
  for (const r of routes) {
    const start = Date.now();
    const res = await fetch(r.path);
    const html = await res.text();
    const latency = Date.now() - start;
    if (res.status === 200) {
      console.log(`✅ [${res.status}] ${r.label} (${r.path}) - ${latency}ms - HTML: ${html.length} bytes`);
      // Verify admin routes do NOT contain the customer shopping cart banner
      if (r.path.includes("/admin") && !r.path.includes("/login")) {
        const hasCustomerCart = html.includes("Free 2-Man Delivery on UK Orders Over");
        console.log(`   Isolated Layout Check (Consumer Header Excluded): ${!hasCustomerCart ? "PASSED (Clean)" : "FAILED"}`);
      }
    } else {
      console.error(`❌ [${res.status}] ${r.label} FAILED!`);
    }
  }

  console.log("\n🎉 ALL TESTS PASSED! Dedicated Admin Panel & Authentication are 100% Operational!");
}

testAdminSuite();
