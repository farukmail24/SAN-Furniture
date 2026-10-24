# SAN Furniture – cPanel Production Deployment Guide

This guide details how to deploy and run the SAN Furniture UK dropshipping platform on a standard cPanel hosting environment (with CloudLinux Phusion Passenger / "Setup Node.js App" and MySQL).

---

## 1. Prerequisites on cPanel

1. **cPanel Feature**: "Setup Node.js App" (Phusion Passenger) enabled by your host.
2. **Node.js Version**: Node.js 20.x or 22.x LTS selected.
3. **MySQL / phpMyAdmin Access**: To create database and import tables.
4. **SSH / Terminal Access** (recommended) or Git Version Control in cPanel.

---

## 2. Database Setup (MySQL)

1. Log into your **cPanel**.
2. Navigate to **MySQL Databases** (or **MySQL Database Wizard**).
3. Create a new database, e.g. `yourcpanel_san_furniture`.
4. Create a database user, e.g. `yourcpanel_dbuser`, set a strong password, and assign **ALL PRIVILEGES** to the database.
5. Open **phpMyAdmin** from cPanel, select `yourcpanel_san_furniture`, go to the **Import** tab.
6. Upload and import `database/san_furniture.sql`.
   - All 23 tables (categories, products, orders, specs, admin_users, customers, settings, etc.) will be created with initial seed data.

---

## 3. Environment Variables Configuration (`.env`)

In your cPanel project root or Node.js application directory, create a `.env` file with your production credentials:

```ini
# Production Environment
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database Configuration (cPanel MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=yourcpanel_san_furniture
DB_USERNAME=yourcpanel_dbuser
DB_PASSWORD=YourStrongDatabasePassword!

# URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.co.uk
NEXT_PUBLIC_API_URL=https://yourdomain.co.uk/api
BACKEND_URL=http://127.0.0.1:9000

# Security Secrets
SAN_AUTH_SECRET=generate_a_64_character_random_hex_string_for_production
```

---

## 4. Setup Applications in cPanel "Setup Node.js App"

### Architecture Options

#### Option A: Running the Standalone Storefront with Internal Rewrites (Recommended)
1. In cPanel, click **Setup Node.js App** -> **Create Application**.
2. Set configuration:
   - **Node.js version**: 20.x or 22.x.
   - **Application mode**: `Production`.
   - **Application root**: `apps/storefront` (or root where files are deployed).
   - **Application URL**: `yourdomain.co.uk`.
   - **Application startup file**: `server.js`.
3. Add the environment variables in the cPanel UI or `.env`.
4. Click **Run NPM Install** (or run `npm install --omit=dev` via cPanel Terminal).
5. Build the application:
   ```bash
   npm run build
   ```
6. Click **Restart** on the application card.

#### Option B: Standalone Output Upload (Lowest Disk Usage & Zero Build on Server)
1. On your local machine or CI/CD, run:
   ```bash
   npm run build
   ```
2. Next.js creates `.next/standalone`.
3. Copy:
   - `apps/storefront/.next/static` -> `apps/storefront/.next/standalone/apps/storefront/.next/static`
   - `apps/storefront/public` -> `apps/storefront/.next/standalone/apps/storefront/public`
4. Upload `.next/standalone` to your cPanel directory.
5. Set the startup file in cPanel to `server.js` and start.

---

## 5. Backend Commerce Engine on Port 9000

For background dropship sync, order automation, and webhooks:
1. In cPanel **Setup Node.js App**, create a second Node.js app:
   - **Application root**: `apps/backend`
   - **Application startup file**: `server.js`
   - **Application URL**: `api.yourdomain.co.uk` (or run on port 9000)
2. Or use PM2 via cPanel Terminal:
   ```bash
   npm install -g pm2
   pm2 start apps/backend/src/server.mjs --name "san-backend"
   pm2 save
   pm2 startup
   ```

---

## 6. Static File Caching & Apache `.htaccess`

The `.htaccess` file provided at the root includes:
- Automatic HTTPS redirection.
- Browser caching rules for images, CSS, JavaScript, and fonts (`mod_expires`).
- Gzip compression (`mod_deflate`).
- Clickjacking & MIME-type protection headers.
