import "../../../../database/mysql-config.mjs";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

async function setupTables() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("Connected to MySQL. Creating Helpdesk & Notification tables...");

  // 1. Create notifications table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      recipient_type ENUM('admin', 'customer') NOT NULL,
      recipient_id VARCHAR(64) NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255) NULL,
      is_read TINYINT(1) DEFAULT 0,
      metadata JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_recipient_read (recipient_type, recipient_id, is_read, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Table 'notifications' created or exists.");

  // 2. Create support_tickets table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(64) PRIMARY KEY,
      ticket_number VARCHAR(32) UNIQUE NOT NULL,
      customer_id VARCHAR(64) NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(50) NULL,
      order_id VARCHAR(64) NULL,
      category ENUM('delivery', 'damaged_item', 'return_refund', 'order_status', 'product_inquiry', 'assembly_help', 'general') NOT NULL DEFAULT 'general',
      priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
      status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NOT NULL DEFAULT 'open',
      subject VARCHAR(255) NOT NULL,
      assigned_to VARCHAR(150) NULL,
      last_reply_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status_priority (status, priority, created_at DESC),
      INDEX idx_customer_email (customer_email),
      INDEX idx_order_id (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Table 'support_tickets' created or exists.");

  // 3. Create support_messages table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id VARCHAR(64) PRIMARY KEY,
      ticket_id VARCHAR(64) NOT NULL,
      sender_type ENUM('customer', 'agent', 'system') NOT NULL,
      sender_id VARCHAR(64) NULL,
      sender_name VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      is_internal_note TINYINT(1) DEFAULT 0,
      attachments JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ticket_timeline (ticket_id, created_at ASC),
      CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Table 'support_messages' created or exists.");

  // Seed sample initial data if empty
  const [notifCount] = await conn.query("SELECT COUNT(*) as count FROM notifications");
  if (notifCount[0].count === 0) {
    console.log("Seeding initial notifications...");
    const sampleNotifs = [
      [
        "notif_adm_1",
        "admin",
        "all",
        "order_created",
        "New High-Value Order: SAN-ORD-2026-8941",
        "Eleanor Vance placed an order for Kensington Velvet Sofa (£2,499.00). 2-Man White Glove delivery requested.",
        "/admin/orders",
        0,
        JSON.stringify({ order_id: "SAN-ORD-2026-8941", value_gbp: 2499.0 }),
      ],
      [
        "notif_adm_2",
        "admin",
        "all",
        "ticket_created",
        "Urgent Helpdesk Ticket: SAN-TK-8021",
        "Arthur Pendelton submitted inquiry: Room of choice access check for Kensington 3-Seater.",
        "/admin/support",
        0,
        JSON.stringify({ ticket_id: "tick_101", priority: "high" }),
      ],
      [
        "notif_adm_3",
        "admin",
        "all",
        "supplier_po",
        "Amos Mann PO Auto-Dispatched",
        "Purchase Order #PO-9912 successfully transmitted to Amos Mann logistics EDI.",
        "/admin/logistics",
        0,
        JSON.stringify({ po_number: "PO-9912" }),
      ],
      [
        "notif_adm_4",
        "admin",
        "all",
        "security_alert",
        "WAF Rate-Limiting Triggered",
        "IP 185.220.101.4 placed into temporary security jail following 5 failed auth handshakes.",
        "/admin/security",
        1,
        JSON.stringify({ ip: "185.220.101.4" }),
      ],
      [
        "notif_cust_1",
        "customer",
        "all",
        "delivery_update",
        "2-Man White Glove Delivery Slot Confirmed",
        "Your order SAN-ORD-2026-8941 is booked for Tuesday morning delivery between 09:00 - 13:00. The logistics crew will call 30 mins prior to arrival.",
        "/account",
        0,
        JSON.stringify({ order_id: "SAN-ORD-2026-8941" }),
      ],
      [
        "notif_cust_2",
        "customer",
        "all",
        "ticket_reply",
        "Concierge Reply: Fabric Swatch Request",
        "White Glove Concierge has dispatched your Bouclé & Velvet fabric swatches via Royal Mail 1st Class.",
        "/account",
        0,
        JSON.stringify({ ticket_id: "tick_102" }),
      ],
    ];

    for (const n of sampleNotifs) {
      await conn.query(
        `INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        n
      );
    }
    console.log("✓ Sample notifications inserted.");
  }

  // Seed sample support tickets
  const [ticketCount] = await conn.query("SELECT COUNT(*) as count FROM support_tickets");
  if (ticketCount[0].count === 0) {
    console.log("Seeding initial support tickets & message threads...");
    const tickets = [
      {
        id: "tick_101",
        ticket_number: "SAN-TK-8021",
        customer_id: "cust_1",
        customer_name: "Arthur Pendelton",
        customer_email: "arthur.p@kensington-estates.co.uk",
        customer_phone: "+44 7700 900542",
        order_id: "SAN-ORD-2026-8941",
        category: "delivery",
        priority: "high",
        status: "open",
        subject: "Room of choice access check for Kensington 3-Seater",
        assigned_to: "Charlotte Davies (Logistics Lead)",
        messages: [
          {
            id: "msg_101_1",
            sender_type: "customer",
            sender_name: "Arthur Pendelton",
            message:
              "Hello SAN Team, our residence on Kensington Church St has a heritage spiral staircase. Will your 2-man white glove delivery team be able to hoist the sofa or should we arrange the resident service lift in advance?",
            is_internal_note: 0,
          },
        ],
      },
      {
        id: "tick_102",
        ticket_number: "SAN-TK-8019",
        customer_id: "cust_2",
        customer_name: "Lady Beatrice Sterling",
        customer_email: "beatrice@sterling-holdings.co.uk",
        customer_phone: "+44 20 7946 0881",
        order_id: "SAN-ORD-2026-8712",
        category: "product_inquiry",
        priority: "medium",
        status: "in_progress",
        subject: "Bespoke fabric swatch matching for Cotswolds Residence",
        assigned_to: "Oliver Vance (Senior Concierge)",
        messages: [
          {
            id: "msg_102_1",
            sender_type: "customer",
            sender_name: "Lady Beatrice Sterling",
            message:
              "We are furnishing our drawing room in Gloucestershire and require physical fabric samples of the Sand Bouclé and Heritage Forest Velvet before placing an order for two armchairs.",
            is_internal_note: 0,
          },
          {
            id: "msg_102_2",
            sender_type: "agent",
            sender_name: "Oliver Vance (Senior Concierge)",
            message:
              "Dear Lady Beatrice, our upholstery artisans in Long Eaton have prepared a bespoke presentation box with 6 curated fabric samples. They are dispatched today via Royal Mail Special Delivery (Tracking #RM992810UK).",
            is_internal_note: 0,
          },
          {
            id: "msg_102_3",
            sender_type: "agent",
            sender_name: "Oliver Vance",
            message: "Client has an estimated £15,000 project underway with Cotswolds interior architects. Flagged as High Priority VIP.",
            is_internal_note: 1,
          },
        ],
      },
      {
        id: "tick_103",
        ticket_number: "SAN-TK-7994",
        customer_id: "cust_3",
        customer_name: "David Hemmings",
        customer_email: "david.hemmings@edinburgh-arch.org",
        customer_phone: "+44 7800 123987",
        order_id: "SAN-ORD-2026-8104",
        category: "damaged_item",
        priority: "urgent",
        status: "waiting_customer",
        subject: "Minor transit scuff on dining chair leg",
        assigned_to: "Charlotte Davies (Logistics Lead)",
        messages: [
          {
            id: "msg_103_1",
            sender_type: "customer",
            sender_name: "David Hemmings",
            message:
              "Upon unboxing the dining set delivered yesterday, one chair leg had a minor scuff on the solid oak finish. Please advise how to proceed.",
            is_internal_note: 0,
          },
          {
            id: "msg_103_2",
            sender_type: "agent",
            sender_name: "Charlotte Davies (Logistics Lead)",
            message:
              "Good morning David, we deeply apologize for this imperfection. We have already initiated a replacement leg dispatch directly from our workshop with next-day courier tracking #DX883910. Could you please confirm if the other chairs arrived in pristine condition?",
            is_internal_note: 0,
          },
        ],
      },
      {
        id: "tick_104",
        ticket_number: "SAN-TK-7840",
        customer_id: "cust_4",
        customer_name: "Gemma Collins",
        customer_email: "gemma@chelsea-design.com",
        customer_phone: "+44 7900 456123",
        order_id: "SAN-ORD-2026-7640",
        category: "assembly_help",
        priority: "low",
        status: "resolved",
        subject: "Assembly guide PDF for Oxford Extendable Table",
        assigned_to: "Oliver Vance (Senior Concierge)",
        messages: [
          {
            id: "msg_104_1",
            sender_type: "customer",
            sender_name: "Gemma Collins",
            message: "Could you please send over the digital PDF assembly instructions for the Oxford Extendable Dining Table?",
            is_internal_note: 0,
          },
          {
            id: "msg_104_2",
            sender_type: "agent",
            sender_name: "Oliver Vance",
            message:
              "Hi Gemma, the digital CAD assembly guide and torque recommendations have been dispatched to your email. We remain at your disposal should your installers require any further assistance.",
            is_internal_note: 0,
          },
        ],
      },
    ];

    for (const t of tickets) {
      await conn.query(
        `INSERT INTO support_tickets 
         (id, ticket_number, customer_id, customer_name, customer_email, customer_phone, order_id, category, priority, status, subject, assigned_to)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.ticket_number,
          t.customer_id,
          t.customer_name,
          t.customer_email,
          t.customer_phone,
          t.order_id,
          t.category,
          t.priority,
          t.status,
          t.subject,
          t.assigned_to,
        ]
      );

      for (const m of t.messages) {
        await conn.query(
          `INSERT INTO support_messages (id, ticket_id, sender_type, sender_name, message, is_internal_note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [m.id, t.id, m.sender_type, m.sender_name, m.message, m.is_internal_note]
        );
      }
    }
    console.log("✓ Sample support tickets and messages inserted.");
  }

  await conn.end();
  console.log("Database schema setup completed successfully!");
}

setupTables().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
