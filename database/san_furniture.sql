-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 15, 2026 at 04:01 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `san_furniture`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` varchar(64) NOT NULL,
  `actor` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `details_json` longtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_audit_logs`
--

INSERT INTO `admin_audit_logs` (`id`, `actor`, `action`, `resource`, `details_json`, `ip_address`, `created_at`) VALUES
('log_001', 'system_initializer', 'SEED_CATALOG', 'database/san_furniture', '{\"tables_initialized\": 9, \"products_count\": 8, \"categories_count\": 5}', '127.0.0.1', '2026-10-15 06:57:21'),
('log_002', 'ops_admin@sanfurniture.com', 'INITIALIZE_MARGINS', 'margin_guard', '{\"floor_margin_pct\": 15, \"default_markup_pct\": 45}', '127.0.0.1', '2026-10-15 06:57:21'),
('log_1792052666442', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:24:26'),
('log_1792052735896', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:25:35'),
('log_1792052802251', 'admin@sanfurniture.com', 'CREATE_PRODUCT', 'products', '{\"id\":\"prod_1792052802184\",\"title\":\"The Kensington Test Ottoman Stool\"}', '::1', '2026-10-15 08:26:42'),
('log_1792052802282', 'admin@sanfurniture.com', 'DELETE_PRODUCT', 'products', '{\"id\":\"prod_1792052802184\"}', '::1', '2026-10-15 08:26:42'),
('log_1792053918688', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:45:18'),
('log_1792053964994', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:46:04'),
('log_1792054028065', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:47:08'),
('log_1792054048117', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 08:47:28'),
('log_1792056728692', 'admin@sanfurniture.com', 'ADMIN_LOGIN', 'admin_users', '{\"role\":\"super_admin\"}', '::1', '2026-10-15 09:32:08'),
('log_1792063593583', 'admin@sanfurniture.com', 'UPDATE_PRODUCT', 'products', '{\"id\":\"prod_bed_002\",\"body\":{\"title\":\"The Cotswold Solid Oak Spindle Bedstead\"}}', '::1', '2026-10-15 11:26:33'),
('log_1792066238235', 'admin@sanfurniture.com', 'UPDATE_PRODUCT', 'products', '{\"id\":\"prod_bed_002\",\"body\":{\"title\":\"The Cotswold Solid Oak Spindle Bedstead\",\"categoryId\":\"cat_beds\",\"pricePennies\":94900,\"supplierCostPennies\":51000,\"thumbnailUrl\":\"https://images.unsplash.com/photo-1747151631051-26733ed2bde3?auto=format&fit=crop&w=1200&q=85\",\"material\":\"none\",\"color\":\"Natural White Oak\",\"widthCm\":158,\"heightCm\":110,\"depthCm\":212,\"weightKg\":56,\"fireSafetyCompliant\":true,\"deliveryType\":\"two_man_white_glove\"}}', '::1', '2026-10-15 12:10:38'),
('log_1792071871882', 'admin@sanfurniture.com', 'DELETE_MEDIA', 'media_assets', '{\"mediaId\":\"media_chair_001\"}', '::1', '2026-10-15 13:44:31'),
('log_1792072047996', 'admin@sanfurniture.com', 'UPLOAD_MEDIA', 'media_assets', '{\"mediaId\":\"media_1792072047978\",\"name\":\"The Cotswold Solid Oak Spindle Bedstead\",\"fileUrl\":\"https://images.unsplash.com/photo-1747151631051-26733ed2bde3?auto=format&fit=crop&w=1200&q=85\"}', '::1', '2026-10-15 13:47:27'),
('log_1792072052125', 'admin@sanfurniture.com', 'UPDATE_PRODUCT', 'products', '{\"id\":\"prod_bed_002\",\"body\":{\"title\":\"The Cotswold Solid Oak Spindle Bedstead\",\"categoryId\":\"cat_beds\",\"pricePennies\":94900,\"supplierCostPennies\":51000,\"thumbnailUrl\":\"https://images.unsplash.com/photo-1747151631051-26733ed2bde3?auto=format&fit=crop&w=1200&q=85\",\"material\":\"none\",\"color\":\"Natural White Oak\",\"widthCm\":158,\"heightCm\":110,\"depthCm\":212,\"weightKg\":56,\"fireSafetyCompliant\":true,\"deliveryType\":\"two_man_white_glove\"}}', '::1', '2026-10-15 13:47:32'),
('log_1792072278028', 'admin@sanfurniture.com', 'SYNC_AMOS_MANN_DROPSHIP_FEED', 'supplier_amos_mann', '{\"syncedCount\":9,\"supplier\":\"Amos Mann Furniture (Leicester)\"}', '::1', '2026-10-15 13:51:18');

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'super_admin',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `email`, `password_hash`, `full_name`, `role`, `is_active`, `last_login_at`, `created_at`) VALUES
('admin_usr_01', 'admin@sanfurniture.com', '7351ae1fcf498b14ae5f2c40c892f0ae:73a7d9e00378770f3b0d67ea7d6993a2bad2ede63160f4aa1035fbded413688625d42d1e7dd813d792b872634bc9d5f3954cf8d167383c84d74ca079a20ab686', 'SAN Operations Lead', 'super_admin', 1, '2026-10-15 15:32:08', '2026-10-15 14:15:22'),
('admin_usr_02', 'sophie.mercer@sanfurniture.com', 'de77820ec0b8f5f911ea667901c9398f:1a3d3bb3ca0a66603856a11096302ba71ff3ccbb458d61ff3eb160933be9667c31478abefcab0fffe8dcef491dad3ce83ac0ec2f79457c2115bb116e827eab63', 'Sophie Mercer', 'catalog_manager', 1, '2026-10-15 15:58:14', '2026-10-15 15:58:14'),
('admin_usr_03', 'james.holloway@sanfurniture.com', 'de77820ec0b8f5f911ea667901c9398f:1a3d3bb3ca0a66603856a11096302ba71ff3ccbb458d61ff3eb160933be9667c31478abefcab0fffe8dcef491dad3ce83ac0ec2f79457c2115bb116e827eab63', 'James Holloway', 'logistics_operator', 1, '2026-10-15 15:58:14', '2026-10-15 15:58:14'),
('admin_usr_04', 'clara.oswald@sanfurniture.com', 'de77820ec0b8f5f911ea667901c9398f:1a3d3bb3ca0a66603856a11096302ba71ff3ccbb458d61ff3eb160933be9667c31478abefcab0fffe8dcef491dad3ce83ac0ec2f79457c2115bb116e827eab63', 'Clara Oswald', 'support_agent', 1, '2026-10-15 15:58:14', '2026-10-15 15:58:14');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `handle` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `hero_image` varchar(512) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `handle`, `description`, `hero_image`, `created_at`) VALUES
('cat_armchairs', 'Accent Armchairs & Stools', 'armchairs', 'Sculptural statement armchairs, reading chairs, and ergonomic occasional seating crafted for British comfort.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85', '2026-10-15 06:57:21'),
('cat_beds', 'Luxury Beds & Wardrobes', 'beds', 'Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes for serene bedroom sanctuaries.', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85', '2026-10-15 06:57:21'),
('cat_dining', 'Dining Tables & Chairs', 'dining', 'Solid European oak, American walnut, and Italian marble dining collections engineered for intimate family gatherings.', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85', '2026-10-15 06:57:21'),
('cat_living', 'Coffee & Occasional Tables', 'living-tables', 'Fluted wood, brushed brass, and architectural stone coffee, side, and console tables.', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85', '2026-10-15 06:57:21'),
('cat_sofas', 'Sofas & Corner Lounges', 'sofas', 'Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85', '2026-10-15 06:57:21');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `created_at`) VALUES
('cust_01', 'eleanor.vance@gmail.com', 'aa4573009f2296b95255813b5dc353f6:ebda37a4810fc79357fabe7ae58eeb91d73d1b758e96395ecfa87adf4ff17e6cf9b777d4b269741fc75549687a8856213f51f23234c43fb16cb9acc01c565674', 'Eleanor', 'Vance', '+44 7700 900123', '2026-10-15 14:15:22'),
('cust_03', 'oliver.twist@kensington.co.uk', '7c4fc9d4be52add502661a30e45a9ce3:ef10c0bee1885cd0077782e71c554926d895ec280585b71c677114cddd43122b9f29e129a79bb702948b2e0549ee1680a5f82dc44d5bf95fad1895d96d076caf', 'Oliver', 'Twist', '+44 7911 123456', '2026-10-15 15:58:15'),
('cust_04', 'charlotte.bronte@edinburgh.ac.uk', '7c4fc9d4be52add502661a30e45a9ce3:ef10c0bee1885cd0077782e71c554926d895ec280585b71c677114cddd43122b9f29e129a79bb702948b2e0549ee1680a5f82dc44d5bf95fad1895d96d076caf', 'Charlotte', 'Brontë', '+44 7822 654321', '2026-10-15 15:58:15'),
('cust_05', 'william.darcy@pemberley.co.uk', '7c4fc9d4be52add502661a30e45a9ce3:ef10c0bee1885cd0077782e71c554926d895ec280585b71c677114cddd43122b9f29e129a79bb702948b2e0549ee1680a5f82dc44d5bf95fad1895d96d076caf', 'William', 'Darcy', '+44 7733 987654', '2026-10-15 15:58:15'),
('cust_1792054010202_0', 'eleanor.vance@mayfair.co.uk', 'c5e5c35be7db1074dedc5689026f8768:5be3ae3632beee933a0f34af19e5e3234a8dbc8ffb9de2e753be63124751b35691909a910c3741476087a5465925a832c236abaab3f08bcd8fb7052161bd2b30', 'Eleanor', 'Vance', '+44 7700 900123', '2026-10-15 14:46:50');

-- --------------------------------------------------------

--
-- Table structure for table `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `postcode` varchar(20) NOT NULL,
  `county` varchar(100) DEFAULT NULL,
  `is_default_delivery` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `address_line1`, `address_line2`, `city`, `postcode`, `county`, `is_default_delivery`, `created_at`) VALUES
('addr_1792053434375', 'cust_01', '14 Kensington Palace Gardens', 'Apt 4B', 'London', 'SW1A 1AA', 'Greater London', 1, '2026-10-15 14:37:14'),
('addr_cust_03', 'cust_03', '14 Berkeley Mews', 'Flat 2B', 'London', 'W1J 5AW', 'Greater London', 1, '2026-10-15 15:58:15'),
('addr_cust_04', 'cust_04', '14 Berkeley Mews', 'Flat 2B', 'London', 'W1J 5AW', 'Greater London', 1, '2026-10-15 15:58:15'),
('addr_cust_05', 'cust_05', '14 Berkeley Mews', 'Flat 2B', 'London', 'W1J 5AW', 'Greater London', 1, '2026-10-15 15:58:15'),
('addr_cust_1792054010202_0', 'cust_1792054010202_0', '14 Kensington Palace Gardens', 'Apt 4B', 'London', 'SW1A 1AA', 'Greater London', 1, '2026-10-15 14:46:50'),
('addr_cust_1792054010292_1', 'cust_1792054010292_1', '14 Kensington Palace Gardens', 'Apt 4B', 'London', 'SW1A 1AA', 'Greater London', 1, '2026-10-15 14:46:50');

-- --------------------------------------------------------

--
-- Table structure for table `customer_reviews`
--

CREATE TABLE `customer_reviews` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `title` varchar(255) NOT NULL,
  `comment` text NOT NULL,
  `verified_purchase` tinyint(1) DEFAULT 1,
  `room_image_url` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'approved',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_reviews`
--

INSERT INTO `customer_reviews` (`id`, `product_id`, `customer_name`, `customer_email`, `rating`, `title`, `comment`, `verified_purchase`, `room_image_url`, `status`, `created_at`) VALUES
('rev_01', 'prod_01', 'Eleanor Vance (London SW1A)', 'eleanor.vance@gmail.com', 5, 'Exceptional Bouclé & 2-Man White Glove Delivery', 'The Kensington sofa arrived within 5 business days. The 2-man delivery team placed it in our second-floor drawing room and removed all packaging. The fabric feels luxurious and tactile.', 1, NULL, 'approved', '2026-10-15 14:38:24'),
('rev_02', 'prod_02', 'James Harrington (Edinburgh EH1)', 'james.h@outlook.com', 5, 'Solid Oak Masterpiece', 'Incredible solid European oak craft. Heavy, sturdy, and seats 8 guests comfortably. Worth every penny.', 1, NULL, 'approved', '2026-10-15 14:38:24'),
('rev_03', 'prod_03', 'Sophie Montgomery (Cotswolds GL5)', 'sophie.m@cotswolds.co.uk', 5, 'Stunning Sculptural Silhouette', 'The Florence velvet armchair is the statement piece of our salon. The deep terracotta velvet catches the natural light gorgeously.', 1, NULL, 'approved', '2026-10-15 14:38:24');

-- --------------------------------------------------------

--
-- Table structure for table `furniture_specs`
--

CREATE TABLE `furniture_specs` (
  `id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `width_cm` decimal(6,2) NOT NULL,
  `height_cm` decimal(6,2) NOT NULL,
  `depth_cm` decimal(6,2) NOT NULL,
  `seat_height_cm` decimal(6,2) DEFAULT NULL,
  `seat_depth_cm` decimal(6,2) DEFAULT NULL,
  `arm_height_cm` decimal(6,2) DEFAULT NULL,
  `weight_kg` decimal(6,2) NOT NULL,
  `material` varchar(100) NOT NULL COMMENT 'boucle, velvet, linen, solid_oak, etc.',
  `frame_material` varchar(100) NOT NULL COMMENT 'solid_oak, engineered_hardwood, steel',
  `color` varchar(100) NOT NULL,
  `assembly_required` tinyint(1) NOT NULL DEFAULT 0,
  `assembly_time_mins` int(11) DEFAULT NULL,
  `doorway_clearance_min_cm` decimal(6,2) NOT NULL DEFAULT 76.20 COMMENT 'UK Standard Doorway Clearance (30 inches)',
  `delivery_tier` enum('standard_parcel','pallet','two_man_white_glove') NOT NULL DEFAULT 'standard_parcel',
  `fire_safety_compliant` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'UK Furniture and Furnishings Fire Safety Regs 1988',
  `fire_safety_standard` varchar(100) NOT NULL DEFAULT 'BS 5852: Part 1: 1979',
  `fire_safety_cert` varchar(100) NOT NULL DEFAULT 'BS-LON-2026-CERT',
  `lead_time_days` int(11) NOT NULL DEFAULT 7,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `furniture_specs`
--

INSERT INTO `furniture_specs` (`id`, `product_id`, `width_cm`, `height_cm`, `depth_cm`, `seat_height_cm`, `seat_depth_cm`, `arm_height_cm`, `weight_kg`, `material`, `frame_material`, `color`, `assembly_required`, `assembly_time_mins`, `doorway_clearance_min_cm`, `delivery_tier`, `fire_safety_compliant`, `fire_safety_standard`, `fire_safety_cert`, `lead_time_days`, `created_at`) VALUES
('', 'prod_am_venice_203', 63.00, 120.00, 24.00, NULL, NULL, NULL, 28.00, 'engineered_hardwood', 'engineered_hardwood', 'Mirrored Glass & White Frame', 1, NULL, 65.00, 'standard_parcel', 1, 'BS 5852 / UK Statutory Timber Compliance', 'BS-LON-2026-CERT', 3, '2026-10-15 13:51:17'),
('spec_bed_001', 'prod_bed_001', 162.00, 135.00, 215.00, NULL, NULL, NULL, 88.00, 'velvet', 'solid_oak', 'Charcoal Slate', 1, 45, 72.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-051', 7, '2026-10-15 06:57:21'),
('spec_bed_002', 'prod_bed_002', 158.00, 110.00, 212.00, NULL, NULL, NULL, 56.00, 'none', 'solid_oak', 'Natural White Oak', 1, 30, 68.00, 'two_man_white_glove', 1, 'BS 5852: Exempt (Solid Timber)', 'WOOD-EXEMPT-052', 7, '2026-10-15 06:57:21'),
('spec_chair_001', 'prod_chair_001', 82.00, 76.00, 80.00, 43.00, 56.00, 58.00, 24.00, 'boucle', 'steel', 'Chalk White', 0, NULL, 65.00, 'standard_parcel', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-004', 3, '2026-10-15 06:57:21'),
('spec_chair_002', 'prod_chair_002', 88.00, 102.00, 90.00, 47.00, 55.00, 64.00, 32.00, 'leather', 'solid_oak', 'Cognac Tan', 1, 10, 68.00, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-005', 5, '2026-10-15 06:57:21'),
('spec_chair_003', 'prod_chair_003', 72.00, 80.00, 84.00, 42.00, NULL, NULL, 19.00, 'leather', 'steel', 'Cognac Tan', 0, NULL, 65.00, 'standard_parcel', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-053', 3, '2026-10-15 06:57:21'),
('spec_dining_001', 'prod_dining_001', 240.00, 76.00, 100.00, NULL, NULL, NULL, 92.00, 'solid_oak', 'solid_oak', 'Natural Oiled Oak', 1, 25, 76.20, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-006', 7, '2026-10-15 06:57:21'),
('spec_dining_002', 'prod_dining_002', 180.00, 76.00, 95.00, NULL, NULL, NULL, 86.00, 'walnut', 'solid_oak', 'Smoked Walnut', 1, 20, 76.20, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-007', 7, '2026-10-15 06:57:21'),
('spec_dining_003', 'prod_dining_003', 52.00, 86.00, 56.00, 48.00, NULL, NULL, 14.00, 'linen', 'solid_oak', 'Natural Oak & Oatmeal', 0, NULL, 60.00, 'standard_parcel', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-055', 3, '2026-10-15 06:57:21'),
('spec_sofa_001', 'prod_sofa_001', 218.00, 84.00, 98.00, 45.00, 64.00, 62.00, 68.00, 'boucle', 'solid_oak', 'Oat Cream', 0, NULL, 75.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-001', 7, '2026-10-15 06:57:21'),
('spec_sofa_002', 'prod_sofa_002', 295.00, 82.00, 165.00, 44.00, 68.00, NULL, 110.00, 'velvet', 'engineered_hardwood', 'Forest Green', 1, 15, 72.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-002', 10, '2026-10-15 06:57:21'),
('spec_sofa_003', 'prod_sofa_003', 165.00, 80.00, 92.00, 46.00, 58.00, 60.00, 46.00, 'linen', 'solid_oak', 'Natural Flax', 0, NULL, 70.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-003', 5, '2026-10-15 06:57:21'),
('spec_sofa_004', 'prod_sofa_004', 310.00, 85.00, 105.00, 44.00, 72.00, NULL, 98.00, 'chenille', 'engineered_hardwood', 'Warm Taupe', 1, 20, 75.00, 'two_man_white_glove', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-056', 10, '2026-10-15 06:57:21'),
('spec_table_001', 'prod_table_001', 110.00, 38.00, 110.00, NULL, NULL, NULL, 64.00, 'travertine', 'steel', 'Beige Travertine', 0, NULL, 70.00, 'pallet', 1, 'BS 5852: Part 1: 1979', 'BS-LON-2026-008', 5, '2026-10-15 06:57:21'),
('spec_table_002', 'prod_table_002', 120.00, 82.00, 36.00, NULL, NULL, NULL, 38.00, 'none', 'brass', 'Calacatta Viola & Gold Brass', 1, 15, 70.00, 'pallet', 1, 'BS 5852: Exempt (Stone & Brass)', 'STONE-EXEMPT-054', 5, '2026-10-15 06:57:21');

-- --------------------------------------------------------

--
-- Table structure for table `media_assets`
--

CREATE TABLE `media_assets` (
  `id` varchar(64) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` text NOT NULL,
  `file_size_bytes` int(11) NOT NULL DEFAULT 0,
  `mime_type` varchar(100) NOT NULL DEFAULT 'image/jpeg',
  `width_px` int(11) NOT NULL DEFAULT 1200,
  `height_px` int(11) NOT NULL DEFAULT 800,
  `alt_text` varchar(255) DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'product',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `media_assets`
--

INSERT INTO `media_assets` (`id`, `file_name`, `file_url`, `file_size_bytes`, `mime_type`, `width_px`, `height_px`, `alt_text`, `category`, `created_at`) VALUES
('media_1792072047978', 'The Cotswold Solid Oak Spindle Bedstead', 'https://images.unsplash.com/photo-1747151631051-26733ed2bde3?auto=format&fit=crop&w=1200&q=85', 320000, 'image/jpeg', 1200, 800, 'The Cotswold Solid Oak Spindle Bedstead', 'product', '2026-10-15 13:47:27'),
('media_bed_001', 'westminster-fluted-velvet-ottoman-bed.jpg', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85', 489000, 'image/jpeg', 1400, 933, 'The Westminster Fluted Velvet Ottoman Storage Bed King Size', 'bedroom', '2026-10-15 09:58:14'),
('media_logo_dark', 'san-furniture-dark-mode-logo.png', '/San-Furniture-Logo-Dark.png', 61191, 'image/png', 800, 240, 'SAN Furniture Official Logo (Dark Navy)', 'branding', '2026-10-15 09:58:14'),
('media_logo_light', 'san-furniture-primary-logo.png', '/SanFurnitureLogo.png', 62352, 'image/png', 800, 240, 'SAN Furniture Official Logo (Light Backgrounds)', 'branding', '2026-10-15 09:58:14'),
('media_sofa_001', 'kensington-grand-boucle-sofa-ivory.jpg', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85', 382400, 'image/jpeg', 1400, 933, 'The Kensington Grand 3-Seater Sofa in Warm Ivory Bouclé', 'sofas', '2026-10-15 09:58:14'),
('media_sofa_002', 'belgravia-l-shape-modular-chaise.jpg', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=85', 421000, 'image/jpeg', 1400, 933, 'The Belgravia Deep Sectional Sofa in Slate Grey Wool', 'sofas', '2026-10-15 09:58:14'),
('media_swatch_001', 'fabric-swatch-heritage-boucle-ivory.jpg', 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1000&q=80', 184000, 'image/jpeg', 1000, 1000, 'Heavyweight Bouclé Fabric Swatch - Warm Ivory', 'swatches', '2026-10-15 09:58:14'),
('media_table_001', 'cotswold-solid-english-oak-dining-table.jpg', 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1400&q=85', 512000, 'image/jpeg', 1400, 933, 'The Cotswold Hand-Turned Solid English Oak Dining Table', 'dining', '2026-10-15 09:58:14');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(64) NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `shipping_address` text NOT NULL,
  `shipping_postcode` varchar(20) NOT NULL,
  `shipping_zone` varchar(50) NOT NULL DEFAULT 'mainland_uk',
  `delivery_tier` varchar(50) NOT NULL DEFAULT 'two_man_white_glove',
  `subtotal_pennies` int(11) NOT NULL,
  `shipping_pennies` int(11) NOT NULL DEFAULT 0,
  `vat_pennies` int(11) NOT NULL,
  `total_pennies` int(11) NOT NULL,
  `payment_status` enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
  `fulfillment_status` enum('unfulfilled','po_dispatched','in_transit','delivered') NOT NULL DEFAULT 'unfulfilled',
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `shipping_postcode`, `shipping_zone`, `delivery_tier`, `subtotal_pennies`, `shipping_pennies`, `vat_pennies`, `total_pennies`, `payment_status`, `fulfillment_status`, `stripe_payment_intent_id`, `created_at`) VALUES
('ord_001', 'ORD-SAN-9981', 'Eleanor Vance', 'eleanor.vance@mayfair.co.uk', '+44 7700 900123', 'Flat 4, 12 Kensington Palace Gardens', 'W8 4QP', 'mainland_uk', 'two_man_white_glove', 129900, 0, 21650, 129900, 'paid', 'po_dispatched', 'pi_test_uk_001', '2026-10-15 06:57:21'),
('ord_002', 'ORD-SAN-9982', 'Alistair Campbell', 'alistair.c@highland-estates.scot', '+44 7700 900456', 'Glenmoriston Lodge, Loch Ness Road', 'IV1 1AA', 'scottish_highlands', 'two_man_white_glove', 219900, 4900, 37467, 224800, 'paid', 'po_dispatched', 'pi_test_uk_002', '2026-10-15 06:57:21'),
('ord_uk_7721', 'SAN-2026-8809', 'Eleanor Vance', 'eleanor.vance@gmail.com', '+44 7700 900123', '14 Kensington Palace Gardens, Apt 4B, London', 'SW1A 1AA', 'zone_1_uk_mainland', 'two_man_white_glove', 129900, 0, 25980, 129900, 'paid', 'in_transit', NULL, '2026-10-15 11:27:15');

-- --------------------------------------------------------

--
-- Table structure for table `order_po_dispatches`
--

CREATE TABLE `order_po_dispatches` (
  `id` varchar(64) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `supplier_id` varchar(100) NOT NULL,
  `item_count` int(11) NOT NULL DEFAULT 1,
  `delivery_tier` varchar(50) NOT NULL DEFAULT 'two_man_white_glove',
  `status` enum('pending','dispatched','acknowledged','delivered') NOT NULL DEFAULT 'dispatched',
  `tracking_number` varchar(255) DEFAULT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `dispatched_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_po_dispatches`
--

INSERT INTO `order_po_dispatches` (`id`, `po_number`, `order_id`, `supplier_id`, `item_count`, `delivery_tier`, `status`, `tracking_number`, `carrier`, `dispatched_at`) VALUES
('po_001', 'PO-SAN-2026-001', 'ord_001', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'ARROW-XL-98214', 'ArrowXL 2-Man White Glove', '2026-10-15 06:57:21'),
('po_002', 'PO-SAN-2026-002', 'ord_002', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'ARROW-XL-98215', 'ArrowXL 2-Man White Glove', '2026-10-15 06:57:21'),
('po_disp_7721', 'PO-SAN-8809', 'ord_uk_7721', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'BJS-2MAN-88200', 'BJS Home Delivery', '2026-10-15 11:27:15');

-- --------------------------------------------------------

--
-- Table structure for table `postcode_zones`
--

CREATE TABLE `postcode_zones` (
  `id` varchar(64) NOT NULL,
  `zone_code` varchar(50) NOT NULL,
  `zone_name` varchar(100) NOT NULL,
  `prefix_list` text NOT NULL COMMENT 'Comma-separated UK postal prefixes',
  `surcharge_pennies` int(11) NOT NULL DEFAULT 0,
  `lead_time_extra_days` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `postcode_zones`
--

INSERT INTO `postcode_zones` (`id`, `zone_code`, `zone_name`, `prefix_list`, `surcharge_pennies`, `lead_time_extra_days`, `is_active`) VALUES
('zone_001', 'mainland_uk', 'UK Mainland Standard Delivery', 'E,EC,N,NW,SE,SW,W,WC,BR,CR,DA,EN,HA,IG,KT,RM,SM,TW,UB,B,M,L,BS,CF,NE,LS,Sheffield,CB,OX', 0, 0, 1),
('zone_002', 'scottish_highlands', 'Scottish Highlands', 'IV,KW,PH,AB,PA', 4900, 3, 1),
('zone_003', 'scottish_islands', 'Scottish Offshore Islands', 'HS,ZE', 6900, 5, 1),
('zone_004', 'northern_ireland', 'Northern Ireland', 'BT', 5900, 4, 1),
('zone_005', 'channel_islands', 'Channel Islands & Isle of Man', 'GY,JE,IM', 6900, 5, 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `handle` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(64) NOT NULL,
  `status` enum('published','draft','out_of_stock') NOT NULL DEFAULT 'published',
  `price_pennies` int(11) NOT NULL COMMENT 'Price in GBP integer pennies (e.g. £1299.00 = 129900)',
  `compare_at_price_pennies` int(11) DEFAULT NULL,
  `vat_rate_percent` decimal(5,2) NOT NULL DEFAULT 20.00 COMMENT 'HMRC UK Standard VAT (20%)',
  `gtin_barcode` varchar(64) DEFAULT NULL,
  `thumbnail_url` varchar(512) NOT NULL,
  `images_json` longtext DEFAULT NULL COMMENT 'JSON array of high-res image URLs',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `title`, `handle`, `subtitle`, `description`, `category_id`, `status`, `price_pennies`, `compare_at_price_pennies`, `vat_rate_percent`, `gtin_barcode`, `thumbnail_url`, `images_json`, `created_at`, `updated_at`) VALUES
('prod_am_athens_tv', 'Athens 160cm High Gloss LED TV Cabinet Unit', 'athens-160cm-high-gloss-led-tv-cabinet', 'Contemporary media console with multi-color RGB remote lighting', 'Elevate your living room entertainment center with the Athens 160cm TV stand. Features high gloss drop-down doors, tempered glass media shelf, integrated cable management port, and multi-color LED atmospheric lighting.', 'cat_living', 'published', 22900, 27900, 20.00, '5060912801046', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_am_atlantis_sideboard', 'Atlantis 2-Door 3-Drawer Sideboard in Cashmere & Oak', 'atlantis-2-door-3-drawer-sideboard-cashmere-oak', 'Architectural fluted doors, brushed brass accents & ample interior storage', 'The Atlantis sideboard seamlessly blends organic warmth with contemporary styling. Featuring dual cupboard spaces with internal shelving and 3 spacious smooth-slide central drawers for dining accessories and lounge essentials.', 'cat_living', 'published', 26900, 31900, 20.00, '5060912801053', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_am_elise_dining', 'Elise 160-200cm Extending Dining Table in High Gloss', 'elise-extending-dining-table-high-gloss', 'Butterfly extension leaf with pedestal column and brushed chrome plinth', 'The Elise Extending Dining Table is crafted for modern UK entertaining. Smooth center butterfly mechanism extends the table effortlessly from 160cm to 200cm, comfortably seating up to 8 dinner guests.', 'cat_dining', 'published', 42900, 49900, 20.00, '5060912801060', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_am_kano_desk', 'Kano Modern Ergonomic Workstation Office Desk with Drawers', 'kano-modern-workstation-office-desk-drawers', 'Durable scratch-resistant top, integrated modesty panel and locking storage', 'Designed for hybrid professionals, the Kano office desk provides a spacious 140cm work surface with built-in cable grommets and a 3-drawer pedestal unit for documents and stationery.', 'cat_living', 'published', 18900, 22900, 20.00, '5060912801084', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:18', '2026-10-15 13:51:18'),
('prod_am_madrid_180', 'Madrid 180cm Luxury Sliding Wardrobe with Mirror & LED', 'madrid-180cm-sliding-wardrobe-mirror-led', 'Compact sliding mirrored wardrobe with built-in LED ambient illumination', 'The Madrid 180cm sliding wardrobe is engineered for stylish UK bedroom storage. Features high-density laminated board, mirror accent facade, multiple compartments, and quiet-glide door track hardware.', 'cat_beds', 'published', 44900, 52900, 20.00, '5060912801022', 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_am_miami_250', 'Miami 250cm 3-Door Sliding Wardrobe with Internal Drawers', 'miami-250cm-3-door-sliding-wardrobe-internal-drawers', 'Grand 2.5m master wardrobe with 3 sliding panels, mirror center & drawers', 'For expansive master bedrooms, the Miami 250cm wardrobe provides immense storage capacity. Three smooth sliding doors enclose triple hanging zones, six adjustable organizational shelves, and integrated soft-close drawers.', 'cat_beds', 'published', 69900, 79900, 20.00, '5060912801039', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_am_santino_shoe', 'Santino 3-Tier Mirrored Shoe Storage Cabinet', 'santino-3-tier-mirrored-shoe-storage-cabinet', 'Slimline 24cm deep hallway shoe cabinet holding up to 18 pairs of shoes', 'Save space in compact UK entryways with the Santino shoe cabinet. Featuring 3 pull-down flap compartments with full-length mirrored door fronts, keeping up to 18 pairs of footwear neatly tucked away.', 'cat_living', 'published', 14900, 17900, 20.00, '5060912801091', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:18', '2026-10-15 13:51:18'),
('prod_am_texas_set', 'Texas 3-Piece Bedroom Furniture Suite (Wardrobe, Chest & Bedside)', 'texas-3-piece-bedroom-furniture-suite', 'Coordinated bedroom set: 2-door wardrobe, 4-drawer chest & bedside table', 'Amos Mann\'s Texas 3-Piece Suite offers complete bedroom harmony at exceptional value. Includes a generous double wardrobe with hanging rail and shelf, a matching 4-drawer chest of drawers, and a compact nightstand.', 'cat_beds', 'published', 59900, 69900, 20.00, '5060912801077', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:18', '2026-10-15 13:51:18'),
('prod_am_venice_203', 'Venice 203cm Sliding Mirrored Wardrobe in Artisan Oak', 'venice-203cm-sliding-mirrored-wardrobe-artisan-oak', 'Smooth-glide dual sliding doors, full mirrored panels & optional LED strip', 'Amos Mann\'s signature Venice 203cm wardrobe combines contemporary Artisan Oak framing with expansive full-height mirrored sliding doors. Featuring generous interior shelving, twin hanging rails, and smooth aluminum rail guides designed for effortless daily operation.', 'cat_beds', 'published', 54900, 64900, 20.00, '5060912801015', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80', '[\"https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80\"]', '2026-10-15 13:51:17', '2026-10-15 13:51:17'),
('prod_bed_001', 'The Westminster Fluted Ottoman Storage Bed in Charcoal Velvet', 'westminster-fluted-ottoman-storage-bed-charcoal-velvet', 'Kingsize gas-lift hydraulic ottoman with hand-fluted architectural headboard', 'Combines grand hotel proportions with seamless hidden underbed storage. Premium German hydraulic gas struts lift effortlessly with the mattress in place.', 'cat_beds', 'published', 119900, 139900, 20.00, '5060123456051', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_bed_002', 'The Cotswold Solid Oak Spindle Bedstead', 'cotswold-solid-oak-spindle-bedstead', 'Artisan tapered spindles and solid European white oak construction', 'Inspired by mid-century Scandinavian and traditional English Shaker craft. Hand-sanded European oak finished in a raw matte protective lacquer.', 'cat_beds', 'published', 94900, 109900, 20.00, '5060123456052', 'https://images.unsplash.com/photo-1747151631051-26733ed2bde3?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1540518614846-7ede433c4b49?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 12:10:38'),
('prod_chair_001', 'The Chelsea Bouclé Swivel Armchair', 'chelsea-boucle-swivel-armchair', '360-degree brushed brass swivel with cocooning curved silhouette', 'The Chelsea brings playful sculptural geometry into the living space. Upholstered in tactile curly wool bouclé with silent 360-degree rotation.', 'cat_armchairs', 'published', 49900, 59900, 20.00, '5060123456004', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_chair_002', 'The Knightsbridge Wingback Reading Chair', 'knightsbridge-wingback-reading-chair', 'Modern interpretation of the classic British fireside wing chair', 'Featuring hand-tufted lumbar cushioning, blackened steel stiletto legs, and buttery cognac aniline leather upholstery.', 'cat_armchairs', 'published', 74900, 84900, 20.00, '5060123456005', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_chair_003', 'The Oxford Saddle Leather Cantilever Lounge Chair', 'oxford-saddle-leather-cantilever-lounge-chair', 'Hand-stitched cognac aniline leather with floating tubular steel frame', 'An architectural icon designed for quiet reading spaces and modern studies. Vegetable-tanned aniline leather acquires an authentic rich patina.', 'cat_armchairs', 'published', 62900, 72900, 20.00, '5060123456053', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_dining_001', 'The Windsor Solid European Oak 8-Seater Dining Table', 'windsor-solid-oak-8-seater-dining-table', 'Hand-finished 40mm solid European oak with chamfered live edge', 'Crafted from sustainable FSC-certified French oak. The 240cm table top rests upon architectural trestle legs with blackened iron tension rods.', 'cat_dining', 'published', 159900, 189900, 20.00, '5060123456006', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_dining_002', 'The Richmond Walnut Extending Dining Table', 'richmond-walnut-extending-dining-table', 'Seats 6 to 10 with concealed smooth butterfly extension mechanism', 'Rich American black walnut veneers with solid walnut perimeter banding. Smooth synchronized metal ball-bearing runner extends from 180cm to 260cm in seconds.', 'cat_dining', 'published', 179900, NULL, 20.00, '5060123456007', 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_dining_003', 'The Cambridge Cane Back Oak Dining Chairs (Set of 2)', 'cambridge-cane-back-oak-dining-chairs-pair', 'French hand-woven rattan cane backrest with natural oatmeal linen seat', 'A celebration of tactile heritage materials. Double-layered natural cane weave provides breathable comfort, paired with a solid American white oak frame.', 'cat_dining', 'published', 38900, 44900, 20.00, '5060123456055', 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_sofa_001', 'The Kensington 3-Seater Sofa in Oat Bouclé', 'kensington-3-seater-sofa-oat-boucle', 'Architectural profile with solid oak plinth and textured bouclé', 'The Kensington pairs deep proportions with sculptural contours. Features high-resilience foam wrapped in feather-down pocketing, delivering an exquisite lounging experience designed for modern British architecture.', 'cat_sofas', 'published', 129900, 149900, 20.00, '5060123456001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85\",\"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_sofa_002', 'The Belgravia Left-Hand Corner Group in Forest Velvet', 'belgravia-left-hand-corner-group-forest-velvet', 'Generous corner chaise wrapped in stain-resistant British velvet', 'Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters and heavy-gauge serpentine springs.', 'cat_sofas', 'published', 219900, 249900, 20.00, '5060123456002', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85\",\"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_sofa_003', 'The Mayfair 2-Seater Loveseat in Natural Linen', 'mayfair-2-seater-loveseat-natural-linen', 'Compact tailored silhouette with Belgian washed linen slipcover', 'Ideal for townhouses and intimate bay windows, the Mayfair offers slender sloped arms, reversible down cushions, and a relaxed removable linen slipcover.', 'cat_sofas', 'published', 89900, NULL, 20.00, '5060123456003', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_sofa_004', 'The Hampstead 4-Seater Modular Sofa in Taupe Chenille', 'hampstead-4-seater-modular-sofa-taupe-chenille', 'Extra-deep 105cm lounging depth with tactile textured Italian chenille', 'Our deepest, most indulgent family sofa. Low-slung contemporary proportions, feather-fiber duvet wrap over pocket spring core.', 'cat_sofas', 'published', 189900, 219900, 20.00, '5060123456056', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_table_001', 'The Somerset Fluted Travertine Coffee Table', 'somerset-fluted-travertine-coffee-table', 'Honed Roman travertine with sculptural fluted cylindrical base', 'Cut from solid Italian beige travertine with natural unfilled pitting. A low-profile architectural focal point with matte protective sealant against spills.', 'cat_living', 'published', 64900, 74900, 20.00, '5060123456008', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21'),
('prod_table_002', 'The Edinburgh Calacatta Marble & Brass Console Table', 'edinburgh-calacatta-marble-brass-console-table', 'Subtle honed Italian Calacatta Viola marble with brushed brass stiletto legs', 'Designed for grand entrance hallways and behind floating sofas. Hand-selected 20mm Italian marble slab with rounded bullnose edges.', 'cat_living', 'published', 79900, 89900, 20.00, '5060123456054', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85', '[\"https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85\"]', '2026-10-15 06:57:21', '2026-10-15 06:57:21');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `discount_type` varchar(50) NOT NULL,
  `discount_value` int(11) NOT NULL,
  `min_order_pennies` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `usage_count` int(11) NOT NULL DEFAULT 0,
  `max_uses` int(11) NOT NULL DEFAULT 1000,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_pennies`, `is_active`, `usage_count`, `max_uses`, `created_at`) VALUES
('promo_bankholiday', 'BANKHOLIDAY20', 'Spring Bank Holiday Special: 20% off orders over £500', 'percentage', 20, 50000, 1, 0, 1000, '2026-10-15 14:38:24'),
('promo_vip100', 'LUXURY100', 'Bespoke VIP Voucher: £100 off orders over £1,000', 'fixed_pennies', 10000, 100000, 1, 0, 1000, '2026-10-15 14:38:24'),
('promo_welcome50', 'WELCOME50', 'Welcome to SAN: £50 off your first handcrafted order over £300', 'fixed_pennies', 5000, 30000, 1, 0, 1000, '2026-10-15 14:38:24');

-- --------------------------------------------------------

--
-- Table structure for table `security_ip_jail`
--

CREATE TABLE `security_ip_jail` (
  `id` varchar(64) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `strike_count` int(11) NOT NULL DEFAULT 1,
  `reason` varchar(255) NOT NULL,
  `locked_until` timestamp NULL DEFAULT NULL,
  `is_permanent` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` varchar(64) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `location` varchar(150) NOT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `contact_email` varchar(150) NOT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `feed_type` varchar(20) NOT NULL DEFAULT 'json',
  `feed_url` varchar(255) DEFAULT NULL,
  `lead_time_days` int(11) NOT NULL DEFAULT 7,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_sync_at` datetime DEFAULT NULL,
  `sync_status` varchar(50) NOT NULL DEFAULT 'operational',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `code`, `location`, `contact_name`, `contact_email`, `contact_phone`, `feed_type`, `feed_url`, `lead_time_days`, `is_active`, `last_sync_at`, `sync_status`, `created_at`) VALUES
('sup_cotswold_artisan', 'Cotswold Solid Oak Joinery', 'sup_cotswold', 'Cirencester, Gloucestershire, UK', 'Arthur Pendelton (Master Joiner)', 'orders@cotswoldtimberwork.co.uk', '+44 1285 654 321', 'xml', 'https://cotswoldtimberwork.co.uk/edi/catalog.xml', 14, 1, '2026-10-15 15:27:18', 'operational', '2026-10-15 09:27:18'),
('sup_nordic_living', 'Nordic Living UK Importers', 'nordic_living_uk', 'Tilbury Docks Distribution Hub, Essex, UK', 'Astrid Lindholm (Logistics Head)', 'b2b-orders@nordiclivinguk.com', '+44 1375 852 400', 'csv', 'https://feeds.nordiclivinguk.com/stock-feed.csv', 4, 1, '2026-10-15 15:27:18', 'operational', '2026-10-15 09:27:18'),
('sup_uk_craft', 'UK Craft Sofas & Upholstery Works', 'uk_craft_sofas', 'Long Eaton, Nottinghamshire, UK', 'Edward Harrison (Works Director)', 'edi-dispatch@ukcraftsofas.co.uk', '+44 115 972 8810', 'json', 'https://api.ukcraftsofas.co.uk/v2/edi-stock.json', 7, 1, '2026-10-15 15:27:18', 'operational', '2026-10-15 09:27:18');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_feed_items`
--

CREATE TABLE `supplier_feed_items` (
  `id` varchar(64) NOT NULL,
  `supplier_id` varchar(100) NOT NULL,
  `supplier_sku` varchar(255) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `cost_price_pennies` int(11) NOT NULL COMMENT 'Supplier wholesale cost in pennies',
  `shipping_cost_pennies` int(11) NOT NULL DEFAULT 0,
  `markup_percentage` decimal(5,2) NOT NULL DEFAULT 35.00,
  `retail_price_pennies` int(11) NOT NULL,
  `stock_level` int(11) NOT NULL DEFAULT 0,
  `lead_time_days` int(11) NOT NULL DEFAULT 7,
  `last_synced_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_feed_items`
--

INSERT INTO `supplier_feed_items` (`id`, `supplier_id`, `supplier_sku`, `product_id`, `cost_price_pennies`, `shipping_cost_pennies`, `markup_percentage`, `retail_price_pennies`, `stock_level`, `lead_time_days`, `last_synced_at`) VALUES
('supp_001', 'uk_craft_sofas', 'CRAFT-KEN-01', 'prod_sofa_001', 68000, 4500, 45.00, 129900, 14, 7, '2026-10-15 06:57:21'),
('supp_002', 'uk_craft_sofas', 'CRAFT-BELG-02', 'prod_sofa_002', 118000, 6500, 48.00, 219900, 8, 10, '2026-10-15 06:57:21'),
('supp_003', 'uk_craft_sofas', 'CRAFT-MAYF-03', 'prod_sofa_003', 46000, 3500, 52.00, 89900, 19, 5, '2026-10-15 06:57:21'),
('supp_004', 'nordic_living_uk', 'NORD-CHEL-04', 'prod_chair_001', 25000, 1500, 55.00, 49900, 26, 3, '2026-10-15 06:57:21'),
('supp_005', 'nordic_living_uk', 'NORD-KNIG-05', 'prod_chair_002', 39000, 3000, 50.00, 74900, 11, 5, '2026-10-15 06:57:21'),
('supp_006', 'cotswold_timber', 'COTS-WIND-06', 'prod_dining_001', 82000, 5500, 52.00, 159900, 6, 7, '2026-10-15 06:57:21'),
('supp_007', 'cotswold_timber', 'COTS-RICH-07', 'prod_dining_002', 94000, 5500, 50.00, 179900, 9, 7, '2026-10-15 06:57:21'),
('supp_008', 'nordic_living_uk', 'NORD-SOME-08', 'prod_table_001', 34000, 4000, 50.00, 64900, 15, 5, '2026-10-15 06:57:21'),
('supp_009', 'uk_craft_sofas', 'CRAFT-WEST-09', 'prod_bed_001', 64000, 5500, 48.00, 119900, 10, 7, '2026-10-15 06:57:21'),
('supp_010', 'cotswold_timber', 'COTS-SPIN-10', 'prod_bed_002', 51000, 4500, 50.00, 94900, 12, 7, '2026-10-15 06:57:21'),
('supp_011', 'nordic_living_uk', 'NORD-OXFO-11', 'prod_chair_003', 33000, 2000, 52.00, 62900, 18, 3, '2026-10-15 06:57:21'),
('supp_012', 'nordic_living_uk', 'NORD-EDIN-12', 'prod_table_002', 42000, 3500, 50.00, 79900, 7, 5, '2026-10-15 06:57:21'),
('supp_013', 'cotswold_timber', 'COTS-CAMB-13', 'prod_dining_003', 19000, 1500, 55.00, 38900, 22, 3, '2026-10-15 06:57:21'),
('supp_014', 'uk_craft_sofas', 'CRAFT-HAMP-14', 'prod_sofa_004', 102000, 6500, 46.00, 189900, 9, 10, '2026-10-15 06:57:21');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'general',
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`, `updated_at`) VALUES
('company_name', 'SAN Furniture UK Ltd', 'legal', 'Registered UK Entity Name', '2026-10-15 09:27:17'),
('company_number', '14289123', 'legal', 'Companies House Registration', '2026-10-15 09:27:17'),
('dropship_auto_dispatch', 'true', 'dropshipping', 'Auto-send Purchase Order EDI to UK suppliers', '2026-10-15 09:27:18'),
('dropship_min_margin_percent', '30', 'dropshipping', 'Floor markup margin safeguard %', '2026-10-15 09:27:18'),
('free_shipping_threshold_pennies', '50000', 'logistics', 'Free 2-Man delivery threshold (£500.00)', '2026-10-15 09:27:17'),
('highlands_surcharge_pennies', '4900', 'logistics', 'Scottish Highlands postcodes extra surcharge (£49.00)', '2026-10-15 09:27:17'),
('ip_jail_duration_mins', '15', 'security', 'Temporary IP jail lock duration in minutes', '2026-10-15 09:27:18'),
('ip_jail_max_failures', '5', 'security', 'Failed attempts before IP lockout', '2026-10-15 09:27:18'),
('klarna_enabled', 'true', 'payment', 'Klarna Pay in 3 / Financing gateway', '2026-10-15 09:27:18'),
('klarna_merchant_id', 'K1482910_GB', 'payment', 'Klarna UK Merchant Account', '2026-10-15 09:27:18'),
('registered_address', '48 Grosvenor Square, Mayfair, London W1K 2HP, United Kingdom', 'legal', 'Official Registered Office', '2026-10-15 09:27:17'),
('standard_delivery_fee_pennies', '4900', 'logistics', 'Standard parcel / pallet rate (£49.00)', '2026-10-15 09:27:17'),
('stripe_enabled', 'true', 'payment', 'Stripe UK Credit/Debit Cards gateway', '2026-10-15 09:27:18'),
('support_email', 'concierge@sanfurniture.com', 'contact', 'Customer Support Email', '2026-10-15 09:27:17'),
('support_phone', '+44 (0) 20 7946 0912', 'contact', 'Customer Phone Line', '2026-10-15 09:27:17'),
('vat_number', 'GB 438 9123 76', 'legal', 'HMRC VAT Registration Number', '2026-10-15 09:27:17'),
('white_glove_fee_pennies', '9900', 'logistics', 'Two-man white glove delivery fee (£99.00)', '2026-10-15 09:27:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_category_handle` (`handle`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`);

--
-- Indexes for table `customer_reviews`
--
ALTER TABLE `customer_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_status` (`product_id`,`status`);

--
-- Indexes for table `furniture_specs`
--
ALTER TABLE `furniture_specs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_specs_product` (`product_id`);

--
-- Indexes for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_order_number` (`order_number`);

--
-- Indexes for table `order_po_dispatches`
--
ALTER TABLE `order_po_dispatches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_po_number` (`po_number`),
  ADD KEY `idx_po_order` (`order_id`);

--
-- Indexes for table `postcode_zones`
--
ALTER TABLE `postcode_zones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_zone_code` (`zone_code`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_product_handle` (`handle`),
  ADD KEY `idx_prod_cat_status_price` (`category_id`,`status`,`price_pennies`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `security_ip_jail`
--
ALTER TABLE `security_ip_jail`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_jailed_ip` (`ip_address`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `supplier_feed_items`
--
ALTER TABLE `supplier_feed_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_supplier_sku` (`supplier_id`,`supplier_sku`),
  ADD KEY `idx_supplier_product` (`product_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `furniture_specs`
--
ALTER TABLE `furniture_specs`
  ADD CONSTRAINT `fk_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_po_dispatches`
--
ALTER TABLE `order_po_dispatches`
  ADD CONSTRAINT `fk_po_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `supplier_feed_items`
--
ALTER TABLE `supplier_feed_items`
  ADD CONSTRAINT `fk_supplier_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
