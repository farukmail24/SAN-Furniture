// scripts/verify-default-card-toggle.mjs
// Verifies that only one card can be default at a time and toggling default updates atomically.

async function testDefaultCardToggle() {
  console.log("=================================================");
  console.log("💳 VERIFYING SINGLE-DEFAULT CARD LOGIC & TOGGLE");
  console.log("=================================================\n");

  const email = "eleanor.vance@gmail.com";

  // Step 1: Query payment methods
  const res1 = await fetch(`http://localhost:3000/api/customer/payment-methods?email=${encodeURIComponent(email)}`);
  const data1 = await res1.json();
  console.log("▶ Current Cards retrieved for", email, ":");
  console.table(data1.paymentMethods.map(c => ({ id: c.id, last4: c.last4, is_default: c.is_default })));

  const defaultCards1 = data1.paymentMethods.filter(c => c.is_default === 1);
  if (defaultCards1.length !== 1) {
    throw new Error(`FAILURE: Expected exactly 1 default card, but found ${defaultCards1.length}`);
  }
  console.log(`✅ EXACTLY 1 card is marked as default: •••• ${defaultCards1[0].last4}`);

  // Find the other card to make it default
  const nonDefaultCard = data1.paymentMethods.find(c => c.is_default === 0);
  if (!nonDefaultCard) {
    console.log("Only 1 card exists, cannot test toggle.");
    return;
  }

  console.log(`\n▶ Toggling default to the other card: •••• ${nonDefaultCard.last4} (${nonDefaultCard.id})...`);
  const toggleRes = await fetch("http://localhost:3000/api/customer/payment-methods", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: nonDefaultCard.id,
      action: "set_default",
      email: email,
    }),
  });
  const toggleData = await toggleRes.json();
  console.log("Toggle API status:", toggleRes.status, toggleData);

  if (!toggleRes.ok || !toggleData.success) {
    throw new Error(`FAILURE: Toggle API failed: ${JSON.stringify(toggleData)}`);
  }

  // Step 2: Query again to verify that ONLY the new card is default
  const res2 = await fetch(`http://localhost:3000/api/customer/payment-methods?email=${encodeURIComponent(email)}`);
  const data2 = await res2.json();
  console.log("\n▶ Updated Cards retrieved after toggle:");
  console.table(data2.paymentMethods.map(c => ({ id: c.id, last4: c.last4, is_default: c.is_default })));

  const defaultCards2 = data2.paymentMethods.filter(c => c.is_default === 1);
  if (defaultCards2.length !== 1) {
    throw new Error(`FAILURE: Expected exactly 1 default card after toggle, but found ${defaultCards2.length}`);
  }
  if (defaultCards2[0].id !== nonDefaultCard.id) {
    throw new Error(`FAILURE: Expected card ${nonDefaultCard.id} to be default, but card ${defaultCards2[0].id} is default.`);
  }
  console.log(`✅ SUCCESS: Card •••• ${defaultCards2[0].last4} is now the sole default card! The other card lost default status.`);

  console.log("\n=================================================");
  console.log("🎉 SINGLE-DEFAULT CARD LOGIC VERIFIED 100%!");
  console.log("=================================================");
}

testDefaultCardToggle().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
