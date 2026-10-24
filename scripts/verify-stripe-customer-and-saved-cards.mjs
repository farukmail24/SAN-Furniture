import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
  port: parseInt(process.env.DB_PORT || "3306", 10),
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key";

async function main() {
  console.log("=================================================");
  console.log("🔍 VERIFYING STRIPE CUSTOMER & SAVED CARDS FLOW");
  console.log("=================================================\n");

  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // -----------------------------------------------------------------
    // TEST 1: Create Payment Intent and verify Stripe Customer attachment
    // -----------------------------------------------------------------
    console.log("▶ TEST 1: Verifying Stripe Customer Attachment in PaymentIntent...");
    const createIntentRes = await fetch("http://localhost:9000/api/checkout/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 10)}`,
      },
      body: JSON.stringify({
        currency: "gbp",
        items: [{ id: "prod_ftg_modena_dining", quantity: 1, unit_price: 49900 }],
        shippingAddress: {
          fullName: "Lady Eleanor Vance",
          email: "eleanor.vance@royaluk.test",
          phone: "+44 7700 900077",
          addressLine1: "45 Kensington Palace Gardens",
          city: "London",
          postcode: "W8 4QA",
          country: "GB",
        },
      }),
    });

    const intentData = await createIntentRes.json();
    console.log("PaymentIntent API Response status:", createIntentRes.status);
    console.log("PaymentIntent ID:", intentData.paymentIntentId);
    console.log("Client Secret received:", intentData.clientSecret ? "YES" : "NO");

    if (!intentData.paymentIntentId) {
      throw new Error(`PaymentIntent creation failed: ${JSON.stringify(intentData)}`);
    }

    // Query Stripe API directly with Stripe Secret Key to inspect the PaymentIntent object
    const stripePiRes = await fetch(`https://api.stripe.com/v1/payment_intents/${intentData.paymentIntentId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const stripePi = await stripePiRes.json();

    console.log("Stripe PaymentIntent customer field:", stripePi.customer);
    console.log("Stripe PaymentIntent receipt_email:", stripePi.receipt_email);

    if (!stripePi.customer || !stripePi.customer.startsWith("cus_")) {
      throw new Error(`FAIL: PaymentIntent does not have a linked Stripe Customer (got: ${stripePi.customer})`);
    }

    // Inspect the Stripe Customer object in Stripe
    const stripeCusRes = await fetch(`https://api.stripe.com/v1/customers/${stripePi.customer}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const stripeCus = await stripeCusRes.json();

    console.log("Stripe Customer Name in Stripe Dashboard:", stripeCus.name);
    console.log("Stripe Customer Email in Stripe Dashboard:", stripeCus.email);
    console.log("Stripe Customer Phone in Stripe Dashboard:", stripeCus.phone);

    if (stripeCus.name !== "Lady Eleanor Vance" || stripeCus.email !== "eleanor.vance@royaluk.test") {
      throw new Error(`FAIL: Customer details on Stripe do not match: ${JSON.stringify(stripeCus)}`);
    }
    console.log("✅ TEST 1 PASSED: Stripe PaymentIntent is linked to Stripe Customer. Name will appear in Dashboard!\n");

    // -----------------------------------------------------------------
    // TEST 2: Order with saveCardForFuture = true (Checkbox CHECKED)
    // -----------------------------------------------------------------
    console.log("▶ TEST 2: Placing order with saveCardForFuture: true (Checkbox CHECKED)...");
    const testPiId1 = `pi_test_checked_${Date.now()}`;
    const orderPayloadChecked = {
      customer: {
        id: 9001,
        name: "Lady Eleanor Vance",
        email: "eleanor.vance@royaluk.test",
        phone: "+44 7700 900077",
      },
      shippingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "45 Kensington Palace Gardens",
        city: "London",
        postcode: "W8 4QA",
        country: "GB",
      },
      billingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "45 Kensington Palace Gardens",
        city: "London",
        postcode: "W8 4QA",
        country: "GB",
      },
      items: [
        {
          id: "prod_ftg_modena_dining",
          quantity: 1,
        },
      ],
      deliveryTier: "standard",
      paymentMethod: "stripe",
      saveCardForFuture: true,
      paymentConfirmation: {
        status: "succeeded",
        paymentIntentId: testPiId1,
        transactionId: `ch_test_${Date.now()}`,
        paymentMethod: "stripe",
        saveCardForFuture: true,
        paymentDetails: {
          cardNumber: "4242424242424242",
          cardholderName: "Lady Eleanor Vance",
          cardExpiry: "12/28",
          cardCvc: "123",
          saveCardForFuture: true,
        },
      },
    };

    const orderRes1 = await fetch("http://localhost:9000/api/checkout/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 10)}`,
      },
      body: JSON.stringify(orderPayloadChecked),
    });
    const orderData1 = await orderRes1.json();
    console.log("Order 1 response status:", orderRes1.status, "Order Number:", orderData1.orderNumber);

    if (!orderData1.success) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderData1)}`);
    }

    // Verify DB insertion
    const [rows1] = await conn.execute(
      "SELECT * FROM customer_payment_methods WHERE customer_email = ? AND last4 = '4242' ORDER BY id DESC LIMIT 1",
      ["eleanor.vance@royaluk.test"]
    );
    console.log("Database record found for 4242:", rows1.length > 0);
    console.log("is_saved_for_future in DB:", rows1[0]?.is_saved_for_future);

    if (rows1.length === 0 || rows1[0].is_saved_for_future !== 1) {
      throw new Error(`FAIL: Expected is_saved_for_future = 1 in database`);
    }

    // Call GET /api/customer/payment-methods
    const getRes1 = await fetch("http://localhost:9000/api/customer/payment-methods?email=eleanor.vance@royaluk.test");
    const getData1 = await getRes1.json();
    console.log("GET /api/customer/payment-methods count:", getData1.paymentMethods?.length);
    const has4242 = getData1.paymentMethods?.some((m) => m.last4 === "4242");
    console.log("Card 4242 present in customer portal response:", has4242);

    if (!has4242) {
      throw new Error(`FAIL: Saved card 4242 should be visible in profile`);
    }
    console.log("✅ TEST 2 PASSED: Checked card is saved in DB and visible in customer profile.\n");

    // -----------------------------------------------------------------
    // TEST 3: Order with saveCardForFuture = false (Checkbox UNCHECKED)
    // -----------------------------------------------------------------
    console.log("▶ TEST 3: Placing order with saveCardForFuture: false (Checkbox UNCHECKED)...");
    const testPiId2 = `pi_test_unchecked_${Date.now()}`;
    const orderPayloadUnchecked = {
      customer: {
        id: 9001,
        name: "Lady Eleanor Vance",
        email: "eleanor.vance@royaluk.test",
        phone: "+44 7700 900077",
      },
      shippingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "45 Kensington Palace Gardens",
        city: "London",
        postcode: "W8 4QA",
        country: "GB",
      },
      billingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "45 Kensington Palace Gardens",
        city: "London",
        postcode: "W8 4QA",
        country: "GB",
      },
      items: [
        {
          id: "prod_ftg_modena_dining",
          quantity: 1,
        },
      ],
      deliveryTier: "standard",
      paymentMethod: "stripe",
      saveCardForFuture: false,
      paymentConfirmation: {
        status: "succeeded",
        paymentIntentId: testPiId2,
        transactionId: `ch_test_${Date.now()}`,
        paymentMethod: "stripe",
        saveCardForFuture: false,
        paymentDetails: {
          cardNumber: "5555444433338888",
          cardholderName: "Lady Eleanor Vance",
          cardExpiry: "10/29",
          cardCvc: "456",
          saveCardForFuture: false,
        },
      },
    };

    const orderRes2 = await fetch("http://localhost:9000/api/checkout/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 10)}`,
      },
      body: JSON.stringify(orderPayloadUnchecked),
    });
    const orderData2 = await orderRes2.json();
    console.log("Order 2 response status:", orderRes2.status, "Order Number:", orderData2.orderNumber);

    if (!orderData2.success) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderData2)}`);
    }

    // Verify DB insertion
    const [rows2] = await conn.execute(
      "SELECT * FROM customer_payment_methods WHERE customer_email = ? AND last4 = '8888' ORDER BY id DESC LIMIT 1",
      ["eleanor.vance@royaluk.test"]
    );
    console.log("Database record found for 8888:", rows2.length > 0);
    console.log("is_saved_for_future for 8888 in DB:", rows2[0]?.is_saved_for_future);

    if (rows2.length === 0 || rows2[0].is_saved_for_future !== 0) {
      throw new Error(`FAIL: Expected is_saved_for_future = 0 in database for unchecked card`);
    }

    // Call GET /api/customer/payment-methods again
    const getRes2 = await fetch("http://localhost:9000/api/customer/payment-methods?email=eleanor.vance@royaluk.test");
    const getData2 = await getRes2.json();
    const has8888 = getData2.paymentMethods?.some((m) => m.last4 === "8888");
    console.log("Card 8888 present in customer portal response:", has8888);

    if (has8888) {
      throw new Error(`FAIL: Unchecked card 8888 should NOT be visible in profile, but it was returned`);
    }
    console.log("✅ TEST 3 PASSED: Unchecked card is preserved in database (is_saved_for_future=0), but hidden from customer profile!\n");

    // -----------------------------------------------------------------
    // TEST 4: Delete / remove card from customer profile
    // -----------------------------------------------------------------
    console.log("▶ TEST 4: Removing saved card from customer profile...");
    const savedCardId = rows1[0].id;
    const delRes = await fetch(
      `http://localhost:9000/api/customer/payment-methods?id=${savedCardId}&email=eleanor.vance@royaluk.test`,
      { method: "DELETE" }
    );
    const delData = await delRes.json();
    console.log("DELETE API response:", delData);

    const [rowsAfterDel] = await conn.execute(
      "SELECT is_saved_for_future FROM customer_payment_methods WHERE id = ?",
      [savedCardId]
    );
    console.log("is_saved_for_future after delete in DB:", rowsAfterDel[0]?.is_saved_for_future);

    if (rowsAfterDel[0]?.is_saved_for_future !== 0) {
      throw new Error(`FAIL: Card was not unlinked from profile in database`);
    }

    const getRes3 = await fetch("http://localhost:9000/api/customer/payment-methods?email=eleanor.vance@royaluk.test");
    const getData3 = await getRes3.json();
    const stillHas4242 = getData3.paymentMethods?.some((m) => m.id === String(savedCardId));
    console.log("Card 4242 still visible in profile:", stillHas4242);

    if (stillHas4242) {
      throw new Error(`FAIL: Card 4242 still returned by customer portal after delete`);
    }
    console.log("✅ TEST 4 PASSED: Customer profile safely removed the card.\n");

    console.log("=================================================");
    console.log("🎉 ALL TESTS PASSED WITH 100% SUCCESS!");
    console.log("=================================================");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in verification:", err);
  process.exit(1);
});
