# SAN Furniture: Notification & Customer Support Helpdesk System
## Master Architecture & Implementation Plan

**Version**: 1.0.0 (Production Blueprint)  
**Date**: October 2026  
**Target Environment**: Next.js 15 (App Router, Tailwind CSS, React 19) + Node.js Commerce Engine (Port 9000) + MySQL (Port 3306)

---

## 1. Executive Summary & Objective

SAN Furniture is an ultra-premium UK dropshipping furniture brand providing luxury living room, dining, and bedroom furniture with white-glove two-man delivery. To deliver an executive-grade customer experience and streamline operational efficiency, this system implements two critical pillars:

1. **Unified Notification System**:
   - **Admin Operations**: Instant real-time alerts for incoming orders, supplier dropship dispatches, low stock thresholds, high-risk security jailings, and incoming support inquiries.
   - **Customer Portal**: Delivery tracking alerts, 2-man delivery appointment confirmations, ticket responses, and VIP account notifications.

2. **Enterprise Customer Support / Helpdesk Suite**:
   - **Admin Helpdesk (`/admin/support`)**: Centralized multi-channel ticket inbox, status transitions (`open`, `in_progress`, `waiting_customer`, `resolved`, `closed`), SLA priority tags (`urgent`, `high`, `medium`, `low`), internal staff notes, canned luxury responses, and direct order linkage.
   - **Customer Helpdesk (`/account` + Floating Concierge Widget)**: Frictionless ticket creation, order-specific claim filing (e.g. damaged transit, room-of-choice query), live conversational thread with SAN White Glove support specialists.

---

## 2. Database Architecture (MySQL 8 / MariaDB)

### 2.1 Table: `notifications`
Stores persistent notifications for both administrators and clients.

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_type ENUM('admin', 'customer') NOT NULL,
  recipient_id VARCHAR(64) NULL, -- 'all', specific admin ID, or customer ID / email
  type VARCHAR(50) NOT NULL,     -- 'order_created', 'order_dispatched', 'support_reply', 'stock_alert', 'security_alert'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255) NULL,
  is_read TINYINT(1) DEFAULT 0,
  metadata JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient_read (recipient_type, recipient_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Table: `support_tickets`
Tracks customer inquiries and claims with order linkages.

```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) PRIMARY KEY,
  ticket_number VARCHAR(32) UNIQUE NOT NULL, -- e.g. SAN-TK-8021
  customer_id VARCHAR(64) NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NULL,
  order_id VARCHAR(64) NULL,                 -- Linked order (e.g. SAN-ORD-2026-...)
  category ENUM('delivery', 'damaged_item', 'return_refund', 'order_status', 'product_inquiry', 'assembly_help', 'general') NOT NULL DEFAULT 'general',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  subject VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(150) NULL,             -- Assigned staff member
  last_reply_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_priority (status, priority, created_at DESC),
  INDEX idx_customer_email (customer_email),
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Table: `support_messages`
Stores the chronological conversation thread between customer and operations team.

```sql
CREATE TABLE IF NOT EXISTS support_messages (
  id VARCHAR(64) PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  sender_type ENUM('customer', 'agent', 'system') NOT NULL,
  sender_id VARCHAR(64) NULL,
  sender_name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_internal_note TINYINT(1) DEFAULT 0,      -- 1 = Visible only to admin staff
  attachments JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_timeline (ticket_id, created_at ASC),
  CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. API Endpoints Specification (Commerce Backend Port 9000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications?recipient_type=admin&is_read=0` | Fetch notifications for Admin or Customer |
| `POST` | `/api/notifications` | Create a new notification (internal trigger) |
| `PATCH` | `/api/notifications/:id/read` | Mark a specific notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read for recipient |
| `GET` | `/api/support/tickets?status=...&priority=...` | List tickets with filters & pagination |
| `POST` | `/api/support/tickets` | Customer or Admin opens a new support ticket |
| `GET` | `/api/support/tickets/:id` | Fetch full ticket details & message thread |
| `PATCH` | `/api/support/tickets/:id` | Update ticket status, priority, or assignee |
| `POST` | `/api/support/tickets/:id/messages` | Post a reply or staff internal note |

---

## 4. Admin UI Architecture

1. **Header Notification Bell**:
   - Live badge counter for unread notifications.
   - Interactive popover drawer with priority categorization, relative timestamps, and one-click navigation to relevant orders/tickets.
   - "Mark all as read" capability.

2. **Admin Sidebar Navigation**:
   - Add **"Customer Helpdesk"** (`/admin/support`) with active ticket count badge.

3. **Admin Helpdesk Suite (`/admin/support/page.tsx`)**:
   - **Ticket Queue**: Split-screen view with search, status filters (`Open`, `In Progress`, `Resolved`), priority indicators.
   - **Detail Conversation Timeline**: Bubble chat thread distinguishing customer inquiries, agent responses, and gold-tinted internal staff notes.
   - **Action Bar**: Instant status changer, priority switcher, staff assignment.
   - **Canned Responses**: One-click quick insertion of standard UK logistics templates (e.g. DX Freight delay update, white-glove replacement, swatch dispatch).
   - **Linked Order Card**: Shows customer details, order value in GBP (£), delivery tier, and carrier info.

---

## 5. Customer Storefront UI Architecture

1. **Customer Account Portal (`/account`)**:
   - New **"Support & Tickets"** navigation tab (`activeTab === 'support'`).
   - Ticket submission modal with order dropdown selector.
   - Chronological ticket message view allowing customers to reply directly.
   - New **"Notifications"** tab (`activeTab === 'notifications'`) displaying delivery tracking and order milestone notifications.

2. **Storefront Floating Concierge Widget (`ConciergeSupportWidget.tsx`)**:
   - Discreet, luxury gold floating badge on the bottom right of the storefront.
   - Expandable modal providing instant FAQ, order tracking lookup, or direct ticket creation.

---

## 6. Execution Roadmap & Milestones

- [x] **Milestone 1**: Resolve browser extension attribute hydration error (`bis_skin_checked="1"`).
- [ ] **Milestone 2**: Create MySQL database tables (`notifications`, `support_tickets`, `support_messages`) with initial seed data.
- [ ] **Milestone 3**: Implement Backend API endpoints in `apps/backend/src/server.mjs`.
- [ ] **Milestone 4**: Build Admin Notification Bell & Dropdown in `apps/storefront/src/app/admin/layout.tsx`.
- [ ] **Milestone 5**: Build Admin Customer Support Suite in `apps/storefront/src/app/admin/support/page.tsx`.
- [ ] **Milestone 6**: Integrate Support Helpdesk & Notifications into Customer Account in `apps/storefront/src/app/account/page.tsx` and Floating Concierge Widget.
- [ ] **Milestone 7**: Quality verification: `npm run typecheck`, `npm run --workspace=storefront build`, and endpoint testing.
