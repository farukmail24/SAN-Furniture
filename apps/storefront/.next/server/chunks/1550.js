exports.id=1550,exports.ids=[1550],exports.modules={16434:(a,b,c)=>{"use strict";c.d(b,{n:()=>g});var d=c(23615);let e=process.env.DB_HOST||"127.0.0.1",f={host:"localhost"===e.toLowerCase()?"127.0.0.1":e,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",waitForConnections:!0,connectionLimit:10,queueLimit:0};function g(){return globalThis.__sanDbPool||(globalThis.__sanDbPool=d.createPool(f)),globalThis.__sanDbPool}},17313:(a,b,c)=>{"use strict";c.d(b,{fetchLiveCategoriesFromDb:()=>j,fetchLiveProductsFromDb:()=>i});var d=c(16434),e=c(75317),f=c(48661);let g=[],h=0;async function i(a=!1){let b=Date.now();if(!a&&g.length>0&&b-h<3e4)return g;try{let a=(0,d.n)(),c=`
      SELECT 
        p.id, p.title, p.handle, p.subtitle, p.description, p.category_id as categoryId,
        p.status, p.price_pennies as pricePennies, p.compare_at_price_pennies as compareAtPricePennies,
        p.vat_rate_percent as vatRatePercent, p.gtin_barcode as gtinBarcode,
        p.thumbnail_url as thumbnailUrl, p.images_json, p.variants_json, p.created_at as createdAt,
        s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.seat_depth_cm,
        s.arm_height_cm, s.weight_kg, s.material, s.frame_material, s.color,
        s.assembly_required, s.assembly_time_mins, s.doorway_clearance_min_cm,
        s.delivery_tier, s.fire_safety_compliant, s.fire_safety_standard,
        s.fire_safety_cert, s.lead_time_days
      FROM products p
      LEFT JOIN furniture_specs s ON p.id = s.product_id
      WHERE p.status IN ('published', 'active')
      ORDER BY p.created_at DESC
    `,[f]=await a.query(c).catch(()=>[[]]);if(!Array.isArray(f)||0===f.length){await (0,e._)();let[b]=await a.query(c).catch(()=>[[]]);f=b}let i=(Array.isArray(f)?f:[]).map(a=>{let b=[];try{b=a.images_json?"string"==typeof a.images_json?JSON.parse(a.images_json):a.images_json:[]}catch{b=[]}0===b.length&&a.thumbnailUrl&&(b=[a.thumbnailUrl]);let c=[];try{c=a.variants_json?"string"==typeof a.variants_json?JSON.parse(a.variants_json):a.variants_json:[]}catch{c=[]}return{id:a.id,createdAt:a.createdAt?String(a.createdAt):void 0,title:a.title,handle:a.handle,subtitle:a.subtitle||"",description:a.description||"",categoryId:a.categoryId,status:("active"===a.status?"published":a.status)||"published",pricePennies:Number(a.pricePennies)||0,compareAtPricePennies:a.compareAtPricePennies?Number(a.compareAtPricePennies):void 0,vatRatePercent:Number(a.vatRatePercent)||20,gtinBarcode:a.gtinBarcode||"",thumbnailUrl:a.thumbnailUrl||b[0]||"",images:b,variants:c,specs:{width_cm:Number(a.width_cm)||0,height_cm:Number(a.height_cm)||0,depth_cm:Number(a.depth_cm)||0,seat_height_cm:a.seat_height_cm?Number(a.seat_height_cm):void 0,seat_depth_cm:a.seat_depth_cm?Number(a.seat_depth_cm):void 0,arm_height_cm:a.arm_height_cm?Number(a.arm_height_cm):void 0,weight_kg:Number(a.weight_kg)||0,material:a.material||"Hardwood",frame_material:a.frame_material||"Solid Wood",color:a.color||"Natural",assembly_required:!!a.assembly_required,assembly_time_mins:a.assembly_time_mins?Number(a.assembly_time_mins):void 0,doorway_clearance_min_cm:a.doorway_clearance_min_cm?Number(a.doorway_clearance_min_cm):void 0,delivery_tier:a.delivery_tier||"two_man_white_glove",fire_safety:{compliant:!!a.fire_safety_compliant,standard:a.fire_safety_standard||"UK Furniture & Furnishings Regulations 1988",certificate_ref:a.fire_safety_cert||"UK-COMPLIANT-VERIFIED",label_attached:!0},lead_time_days:Number(a.lead_time_days)||5}}});return i.length>0&&(g=i,h=b),i}catch(a){return console.warn("fetchLiveProductsFromDb failed:",a),g}}async function j(){try{let a=(0,d.n)(),[b]=await a.query("SELECT id, name, handle, description, hero_image as heroImage FROM categories ORDER BY id ASC").catch(()=>[[]]);if(Array.isArray(b)&&b.length>0)return b.map(a=>({id:a.id,name:a.name,handle:a.handle,description:a.description||"",heroImage:a.heroImage||""}))}catch(a){console.warn("fetchLiveCategoriesFromDb failed:",a)}return f.Nq}},75317:(a,b,c)=>{"use strict";c.d(b,{_:()=>j});var d=c(23615),e=c(29021),f=c.n(e),g=c(33873),h=c.n(g);async function i(a){try{await a.query(`
      CREATE TABLE IF NOT EXISTS \`customer_payment_methods\` (
        \`id\` varchar(64) NOT NULL,
        \`customer_id\` varchar(64) DEFAULT NULL,
        \`customer_email\` varchar(255) NOT NULL,
        \`brand\` varchar(32) DEFAULT 'Visa',
        \`last4\` varchar(4) NOT NULL,
        \`exp_month\` int(11) NOT NULL,
        \`exp_year\` int(11) NOT NULL,
        \`cardholder_name\` varchar(255) DEFAULT NULL,
        \`stripe_payment_method_id\` varchar(100) DEFAULT NULL,
        \`stripe_customer_id\` varchar(100) DEFAULT NULL,
        \`is_saved_for_future\` tinyint(1) DEFAULT 0,
        \`is_default\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_cpm_email\` (\`customer_email\`),
        KEY \`idx_cpm_customer_id\` (\`customer_id\`),
        KEY \`idx_cpm_saved\` (\`customer_email\`,\`is_saved_for_future\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `),await a.query(`
      CREATE TABLE IF NOT EXISTS \`customer_password_resets\` (
        \`id\` varchar(36) NOT NULL,
        \`customer_id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`token_hash\` varchar(255) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`used_at\` datetime DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_cpr_token\` (\`token_hash\`),
        KEY \`idx_cpr_email\` (\`email\`),
        KEY \`idx_cpr_cust\` (\`customer_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);let[b]=await a.query("SHOW COLUMNS FROM orders LIKE 'cancellation_reason'").catch(()=>[[]]);Array.isArray(b)&&0!==b.length||await a.query(`
        ALTER TABLE \`orders\`
        ADD COLUMN \`cancellation_reason\` text DEFAULT NULL AFTER \`fulfillment_status\`,
        ADD COLUMN \`cancelled_by\` varchar(255) DEFAULT NULL AFTER \`cancellation_reason\`,
        ADD COLUMN \`cancelled_at\` datetime DEFAULT NULL AFTER \`cancelled_by\`
      `).catch(()=>{})}catch(a){console.warn("[auto-seed] Non-destructive schema check error:",a)}}async function j(){let a=process.env.DB_HOST||"127.0.0.1",b="localhost"===a.toLowerCase()?"127.0.0.1":a,c=null;try{c=await d.createConnection({host:b,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",multipleStatements:!0});let[a]=await c.query("SHOW TABLES").catch(()=>[[]]);if((Array.isArray(a)?a.length:0)>0){await i(c);let[a]=await c.query("SELECT COUNT(*) as c FROM products").catch(()=>[[{c:0}]]);if(Number(a?.[0]?.c??0)>0)return!1;let[b]=await c.query("SELECT COUNT(*) as c FROM orders").catch(()=>[[{c:0}]]),[d]=await c.query("SELECT COUNT(*) as c FROM customers").catch(()=>[[{c:0}]]),e=Number(b?.[0]?.c??0),f=Number(d?.[0]?.c??0);if(e>0||f>0)return console.warn(`> Safety Guard: Database has live operational records (${e} orders, ${f} customers). Will NOT drop tables.`),!1}console.log("> Database empty or missing tables. Auto-seeding from san_furniture.sql...");let e=function(){for(let a of[h().resolve(process.cwd(),"san_furniture.sql"),h().resolve(process.cwd(),"database/san_furniture.sql"),h().resolve(__dirname,"../../../../../san_furniture.sql"),h().resolve(__dirname,"../../../../../database/san_furniture.sql"),h().resolve(__dirname,"../../san_furniture.sql"),h().resolve(__dirname,"../san_furniture.sql")])if(f().existsSync(a))try{let b=f().readFileSync(a,"utf8");if(b.includes("CREATE TABLE")&&b.includes("products"))return b}catch{}return""}();if(!e)return console.warn("> Could not locate san_furniture.sql to auto-seed."),!1;return await c.query(e),console.log("> Database auto-seeded successfully with all tables and catalog items!"),!0}catch(a){return console.warn("> Auto-seed check error:",a),!1}finally{if(c)try{await c.end()}catch{}}}},99972:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=99972,a.exports=b}};