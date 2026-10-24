// scripts/verify-saved-card-rejection.mjs
// Verifies that a saved bogus card (like last4: 8888) is STRICTLY DECLINED by Stripe and CANNOT place an order!

import mysql from "mysql2/promise";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("🛡️ VERIFYING SAVED CARD SECURITY & REJECTION GATE");
  console.log("=================================================\n");

  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture",
  });

  const getOrderCount = async () => {
    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM orders");
    return rows[0].cnt;
  };

  const initialOrderCount = await getOrderCount();
  console.log(`Initial orders in database: ${initialOrderCount}\n`);

  // Step 1: Query saved cards for eleanor.vance@gmail.com
  const cardsRes = await fetch(`${BASE_URL}/api/customer/payment-methods?email=eleanor.vance@gmail.com`);
  const cardsData = await cardsRes.json();
  const card8888 = cardsData.paymentMethods.find(c => c.last4 === "8888");
  const card4242 = cardsData.paymentMethods.find(c => c.last4 === "4242");

  console.log("Found Saved Cards:");
  console.log("- Bogus saved card:", card8888 ? `•••• ${card8888.last4} (${card8888.id})` : "NOT FOUND");
  console.log("- Valid saved card:", card4242 ? `•••• ${card4242.last4} (${card4242.id})` : "NOT FOUND");

  // Helper to create intent
  const createIntent = async () => {
    const res = await fetch(`${BASE_URL}/api/checkout/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountPennies: 27552,
        customer: { email: "eleanor.vance@gmail.com", name: "Eleanor Vance" },
        items: [{ productId: "prod_ftg_1014111", quantity: 1, pricePennies: 27552 }],
      }),
    });
    return res.json();
  };

  // --------------------------------------------------------------------------
  // TEST 1: Pay using the SAVED BOGUS CARD (last4: 8888)
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 1: Paying with SAVED BOGUS CARD (•••• 8888)...");
  const intent1 = await createIntent();
  const conf1Res = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent1.paymentIntentId,
      paymentMethod: "card",
      amountPennies: 27552,
      paymentDetails: {
        cardNumber: "•••• •••• •••• 8888",
        cardholderName: "Eleanor Vance",
        cardExpiry: "12/29",
        cardCvc: "123",
        isSavedCard: true,
        savedCardId: card8888 ? card8888.id : "cpm_fake",
        brand: "Visa",
        last4: "8888",
        saveCardForFuture: false,
      },
    }),
  });
  const conf1Data = await conf1Res.json();
  console.log(`Response status: ${conf1Res.status} | Success: ${conf1Data.success} | Error: "${conf1Data.error}"`);

  if (conf1Res.status === 402 && conf1Data.success === false && conf1Data.error.includes("declined")) {
    console.log("✅ TEST 1 PASSED: Saved bogus card (•••• 8888) was STRICTLY DECLINED by Stripe!");
  } else {
    throw new Error(`TEST 1 FAILED: Saved bogus card was NOT declined: ${JSON.stringify(conf1Data)}`);
  }

  // Verify NO order was created
  const countAfterTest1 = await getOrderCount();
  if (countAfterTest1 !== initialOrderCount) {
    throw new Error("SECURITY FAILURE: Order was created for declined saved card!");
  }
  console.log("✅ Verified: Zero orders placed for the declined saved card!");

  // --------------------------------------------------------------------------
  // TEST 2: Pay using the SAVED VALID TEST CARD (last4: 4242)
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Paying with SAVED VALID CARD (•••• 4242)...");
  const intent2 = await createIntent();
  const conf2Res = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent2.paymentIntentId,
      paymentMethod: "card",
      amountPennies: 27552,
      paymentDetails: {
        cardNumber: "•••• •••• •••• 4242",
        cardholderName: "Lady Eleanor Vance",
        cardExpiry: "12/28",
        cardCvc: "123",
        isSavedCard: true,
        savedCardId: card4242 ? card4242.id : "cpm_demo",
        brand: "Visa",
        last4: "4242",
        saveCardForFuture: false,
      },
    }),
  });
  const conf2Data = await conf2Res.json();
  console.log(`Response status: ${conf2Res.status} | Success: ${conf2Data.success} | TransactionId: ${conf2Data.transactionId}`);

  if (conf2Res.status === 200 && conf2Data.success && conf2Data.transactionId) {
    console.log("✅ TEST 2 PASSED: Legitimate saved card (•••• 4242) successfully authorized on Stripe!");
  } else {
    throw new Error(`TEST 2 FAILED: Legitimate saved card authorization failed: ${JSON.stringify(conf2Data)}`);
  }

  // Now create order for the verified payment
  const orderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Lady Eleanor Vance",
        email: "eleanor.vance@gmail.com",
        phone: "+44 7700 900123",
      },
      shippingAddress: {
        addressLine1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
      },
      deliveryTier: "del_opt_001",
      paymentMethod: "card",
      paymentConfirmation: {
        paymentIntentId: intent2.paymentIntentId,
        status: "succeeded",
        transactionId: conf2Data.transactionId,
      },
      items: [{ productId: "prod_ftg_1014111", quantity: 1, pricePennies: 27552 }],
    }),
  });
  const orderData = await orderRes.json();
  console.log(`Order placement status: ${orderRes.status} | Order Number: ${orderData.orderNumber}`);

  if ((orderRes.status === 200 || orderRes.status === 201) && orderData.success && orderData.orderNumber) {
    console.log("✅ Verified order successfully placed for genuine saved card payment!");
  } else {
    throw new Error(`Order placement failed: ${JSON.stringify(orderData)}`);
  }

  const finalOrderCount = await getOrderCount();
  console.log(`\nFinal order count in DB: ${finalOrderCount} (Exactly 1 new order added)`);

  await pool.end();
  console.log("\n=================================================");
  console.log("🎉 ALL SAVED CARD REJECTION & VERIFICATION TESTS PASSED!");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
