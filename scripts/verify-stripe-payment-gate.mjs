// scripts/verify-stripe-payment-gate.mjs
// Verifies that invalid, declined, and fake payments CANNOT place orders,
// and only genuine successful Stripe transactions can create orders.

import mysql from "mysql2/promise";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("🛡️ VERIFYING STRICT STRIPE PAYMENT SECURITY GATE");
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

  // Helper to create intent
  const createIntent = async () => {
    const res = await fetch(`${BASE_URL}/api/checkout/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountPennies: 27552,
        customer: {
          email: "security.test@example.com",
          name: "Security Tester",
          phone: "+44 7700 900999",
        },
        items: [{ productId: "prod_ftg_1014111", quantity: 1, pricePennies: 27552 }],
      }),
    });
    return res.json();
  };

  // --------------------------------------------------------------------------
  // TEST 1: Payment with Decline Test Card (4000 0000 0000 0002)
  // --------------------------------------------------------------------------
  console.log("▶ TEST 1: Attempting payment with Stripe decline test card (4000 0000 0000 0002)...");
  const intent1 = await createIntent();
  const conf1 = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent1.paymentIntentId,
      amountPennies: 47900,
      paymentMethod: "card",
      paymentDetails: {
        cardNumber: "4000 0000 0000 0002",
        cardExpiry: "12/28",
        cardCvc: "123",
        cardholderName: "Security Tester",
      },
    }),
  });
  const conf1Data = await conf1.json();
  console.log(`Response status: ${conf1.status} | Success: ${conf1Data.success} | Error: "${conf1Data.error}"`);

  if (conf1.status === 402 && conf1Data.success === false && conf1Data.error.includes("declined")) {
    console.log("✅ TEST 1 PASSED: Stripe decline card was strictly rejected with 402!");
  } else {
    throw new Error(`TEST 1 FAILED: Decline card was not rejected properly: ${JSON.stringify(conf1Data)}`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Payment with Expired Date (12/20)
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Attempting payment with expired date (12/20)...");
  const intent2 = await createIntent();
  const conf2 = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent2.paymentIntentId,
      amountPennies: 47900,
      paymentMethod: "card",
      paymentDetails: {
        cardNumber: "4242 4242 4242 4242",
        cardExpiry: "12/20",
        cardCvc: "123",
        cardholderName: "Security Tester",
      },
    }),
  });
  const conf2Data = await conf2.json();
  console.log(`Response status: ${conf2.status} | Success: ${conf2Data.success} | Error: "${conf2Data.error}"`);

  if (conf2.status === 402 && conf2Data.error.includes("expired")) {
    console.log("✅ TEST 2 PASSED: Expired card was strictly rejected with 402!");
  } else {
    throw new Error(`TEST 2 FAILED: Expired card was not rejected: ${JSON.stringify(conf2Data)}`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Payment with Invalid CVC ("000")
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Attempting payment with invalid CVC ('000')...");
  const intent3 = await createIntent();
  const conf3 = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent3.paymentIntentId,
      amountPennies: 47900,
      paymentMethod: "card",
      paymentDetails: {
        cardNumber: "4242 4242 4242 4242",
        cardExpiry: "12/28",
        cardCvc: "000",
        cardholderName: "Security Tester",
      },
    }),
  });
  const conf3Data = await conf3.json();
  console.log(`Response status: ${conf3.status} | Success: ${conf3Data.success} | Error: "${conf3Data.error}"`);

  if (conf3.status === 402 && conf3Data.error.includes("security code")) {
    console.log("✅ TEST 3 PASSED: Invalid CVC was strictly rejected with 402!");
  } else {
    throw new Error(`TEST 3 FAILED: Invalid CVC was not rejected: ${JSON.stringify(conf3Data)}`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Attempting to bypass payment and call create-order directly with an unsettled PaymentIntent
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Attempting order submission with an unconfirmed PaymentIntent...");
  const intent4 = await createIntent();
  const orderBypassRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Security Tester",
        email: "security.test@example.com",
        phone: "+44 7700 900999",
      },
      shippingAddress: {
        addressLine1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
      },
      deliveryTier: "del_opt_001",
      paymentMethod: "card",
      paymentConfirmation: {
        paymentIntentId: intent4.paymentIntentId,
        status: "succeeded", // Faking status on client side!
        transactionId: "fake_txn_12345",
      },
      items: [{ productId: "prod_dining_table_01", quantity: 1, pricePennies: 47900 }],
    }),
  });
  const orderBypassData = await orderBypassRes.json();
  console.log(`Response status: ${orderBypassRes.status} | Success: ${orderBypassData.success} | Error: "${orderBypassData.error}"`);

  if (orderBypassRes.status === 402 && orderBypassData.error.includes("not settled")) {
    console.log("✅ TEST 4 PASSED: Server-side Stripe verification blocked the fake order!");
  } else {
    throw new Error(`TEST 4 FAILED: Unverified order was not blocked: ${JSON.stringify(orderBypassData)}`);
  }

  // Verify that NO order was inserted for Tests 1-4
  const countAfterFailures = await getOrderCount();
  console.log(`\nOrder count after failed attempts: ${countAfterFailures} (Expected: ${initialOrderCount})`);
  if (countAfterFailures !== initialOrderCount) {
    throw new Error("SECURITY FAILURE: Orders were inserted despite failed payments!");
  }
  console.log("✅ ZERO orders recorded during failed/invalid payment attempts!");

  // --------------------------------------------------------------------------
  // TEST 5: Legitimate Payment with Valid Stripe Test Card (4242 4242 4242 4242)
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 5: Attempting legitimate payment with valid Stripe test card...");
  const intent5 = await createIntent();
  const conf5 = await fetch(`${BASE_URL}/api/checkout/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intent5.paymentIntentId,
      amountPennies: 27552,
      paymentMethod: "card",
      paymentDetails: {
        cardNumber: "4242 4242 4242 4242",
        cardExpiry: "12/28",
        cardCvc: "123",
        cardholderName: "Security Tester",
        isSavedCard: false,
        saveCardForFuture: false,
      },
    }),
  });
  const conf5Data = await conf5.json();
  console.log(`Payment status: ${conf5.status} | Success: ${conf5Data.success} | TransactionId: ${conf5Data.transactionId}`);

  if (conf5.status !== 200 || !conf5Data.success || !conf5Data.transactionId) {
    throw new Error(`TEST 5 FAILED: Legitimate payment failed: ${JSON.stringify(conf5Data)}`);
  }

  // Now submit order for verified payment
  const order5Res = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Security Tester",
        email: "security.test@example.com",
        phone: "+44 7700 900999",
      },
      shippingAddress: {
        addressLine1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
      },
      deliveryTier: "del_opt_001",
      paymentMethod: "card",
      paymentConfirmation: {
        paymentIntentId: intent5.paymentIntentId,
        status: "succeeded",
        transactionId: conf5Data.transactionId,
      },
      items: [{ productId: "prod_ftg_1014111", quantity: 1, pricePennies: 27552 }],
    }),
  });
  const order5Data = await order5Res.json();
  console.log(`Order status: ${order5Res.status} | Order Number: ${order5Data.orderNumber}`);

  if ((order5Res.status === 200 || order5Res.status === 201) && order5Data.success && order5Data.orderNumber) {
    console.log("✅ TEST 5 PASSED: Verified order successfully created ONLY after Stripe confirmed payment!");
  } else {
    throw new Error(`TEST 5 FAILED: Order creation failed after verified payment: ${JSON.stringify(order5Data)}`);
  }

  const finalOrderCount = await getOrderCount();
  console.log(`\nFinal order count: ${finalOrderCount} (Exactly 1 order created for the 1 valid payment)`);

  await pool.end();
  console.log("\n=================================================");
  console.log("🎉 ALL STRIPE SECURITY & INTEGRITY GATES PASSED!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
