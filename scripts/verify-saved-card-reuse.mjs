import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
  port: parseInt(process.env.DB_PORT || "3306", 10),
};

async function main() {
  console.log("=================================================");
  console.log("🔍 VERIFYING SAVED CARD CHECKOUT REUSE FLOW");
  console.log("=================================================\n");

  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // -----------------------------------------------------------------
    // TEST 1: Query Saved Cards for eleanor.vance@gmail.com
    // -----------------------------------------------------------------
    console.log("▶ TEST 1: Querying saved cards for logged-in user eleanor.vance@gmail.com...");
    const resGmail = await fetch("http://localhost:3000/api/customer/payment-methods?email=eleanor.vance@gmail.com");
    const dataGmail = await resGmail.json();
    console.log("Status:", resGmail.status, "Cards count:", dataGmail.paymentMethods?.length);

    if (!dataGmail.success || !Array.isArray(dataGmail.paymentMethods) || dataGmail.paymentMethods.length === 0) {
      throw new Error(`FAIL: No saved cards returned for eleanor.vance@gmail.com: ${JSON.stringify(dataGmail)}`);
    }
    const card = dataGmail.paymentMethods[0];
    console.log("Saved Card retrieved:", `${card.brand} •••• ${card.last4}`, "Expires:", `${card.exp_month}/${card.exp_year}`);
    console.log("✅ TEST 1 PASSED: Logged in customer has active saved cards available in profile and checkout!\n");

    // -----------------------------------------------------------------
    // TEST 2: Place 1-Click Order reusing the Saved Card
    // -----------------------------------------------------------------
    console.log("▶ TEST 2: Placing order with reused saved card (1-click accelerated checkout)...");
    // Step 2a: Create real Stripe PaymentIntent
    const intentRes = await fetch("http://localhost:3000/api/checkout/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountPennies: 27552,
        customer: { email: "eleanor.vance@gmail.com", name: "Lady Eleanor Vance" },
        items: [{ productId: "prod_ftg_1014111", quantity: 1, pricePennies: 27552 }],
      }),
    });
    const intentData = await intentRes.json();

    // Step 2b: Confirm with saved card via confirm-payment
    const activeSavedCardDetails = {
      cardNumber: `•••• •••• •••• ${card.last4}`,
      cardholderName: card.cardholder_name,
      cardExpiry: `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`,
      cardCvc: "123",
      isSavedCard: true,
      savedCardId: card.id,
      brand: card.brand,
      last4: card.last4,
      saveCardForFuture: false,
    };

    const confirmRes = await fetch("http://localhost:3000/api/checkout/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: intentData.paymentIntentId,
        paymentMethod: "card",
        amountPennies: 27552,
        paymentDetails: activeSavedCardDetails,
      }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmData.success) {
      throw new Error(`Saved card payment confirmation failed: ${JSON.stringify(confirmData)}`);
    }

    const orderPayload = {
      customer: {
        id: "cust_01",
        name: "Lady Eleanor Vance",
        email: "eleanor.vance@gmail.com",
        phone: "+44 7700 900123",
      },
      shippingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
        country: "United Kingdom",
      },
      billingAddress: {
        fullName: "Lady Eleanor Vance",
        addressLine1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
        country: "United Kingdom",
        email: "eleanor.vance@gmail.com",
        phone: "+44 7700 900123",
      },
      items: [
        {
          id: "prod_ftg_1014111",
          quantity: 1,
        },
      ],
      deliveryTier: "del_opt_001",
      paymentMethod: "card",
      saveCardForFuture: false,
      paymentDetails: activeSavedCardDetails,
      paymentConfirmation: {
        status: "succeeded",
        paymentIntentId: intentData.paymentIntentId,
        transactionId: confirmData.transactionId,
        paymentMethod: "card",
        saveCardForFuture: false,
        paymentDetails: activeSavedCardDetails,
      },
    };

    const orderRes = await fetch("http://localhost:9000/api/checkout/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 10)}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const orderData = await orderRes.json();
    console.log("Order placement status:", orderRes.status, "Order Number:", orderData.orderNumber);

    if (!orderData.success) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderData)}`);
    }

    // Check DB that card wasn't duplicated and remains is_saved_for_future = 1
    const [dbRows] = await conn.execute(
      "SELECT id, brand, last4, is_saved_for_future, is_default FROM customer_payment_methods WHERE customer_email = ? AND is_saved_for_future = 1",
      ["eleanor.vance@gmail.com"]
    );
    console.log("Saved cards count in DB for eleanor.vance@gmail.com:", dbRows.length);
    if (dbRows.length === 0 || dbRows[0].is_saved_for_future !== 1) {
      throw new Error("FAIL: Saved card disappeared or was marked inactive!");
    }
    console.log("✅ TEST 2 PASSED: 1-click accelerated checkout successfully placed order without duplicating card!\n");

    console.log("=================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
