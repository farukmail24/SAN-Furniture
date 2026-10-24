/**
 * SAN Furniture - Page Builder & CMS Default Sections Single Source of Truth
 * Auto-synchronized with 30 Live Page Components
 */

export const DEFAULT_PAGE_SECTIONS = [
  // ==========================================
  // 1. HEADER & NAVIGATION
  // ==========================================
  {
    id: "sec_header_top_bar",
    page_key: "header",
    section_key: "header_top_bar",
    section_name: "Top Announcement & Value Strip",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      delivery_claim: "UK Mainland Delivery Direct to Your Door",
      quality_claim: "UK Quality Checked • Free Mainland Delivery Within 15 Days",
      payment_claim: "Secure Card Payments",
      tax_claim: "Zero Hidden Fees",
      support_phone: "+44 20 7946 0192",
      show_support_phone: true,
      banner_link: "/delivery",
    }),
  },
  {
    id: "sec_header_main",
    page_key: "header",
    section_key: "header_main",
    section_name: "Header Navigation & Sticky Controls",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      is_sticky: true,
      sticky_behavior: "always",
      hide_topbar_on_scroll: false,
      search_placeholder: "Search sofas, solid oak dining, ottoman beds...",
      support_cta_label: "Concierge Help",
      hotline_label: "Direct Dispatch Line: +44 20 7946 0192",
      client_portal_label: "Client Account",
    }),
  },
  {
    id: "sec_header_mega_menu",
    page_key: "header",
    section_key: "header_mega_menu",
    section_name: "Desktop & Mobile Mega Menu Navigation",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify({
      tabs: [
        {
          id: "sofas",
          label: "Sofas & Seating",
          href: "/categories/sofas",
          badge: "",
          columns: [
            {
              title: "Sofas By Style",
              links: [
                { label: "All Sofas & Couches", href: "/categories/sofas" },
                { label: "Corner & L-Shape Lounges", href: "/categories/sofas?style=corner", badge: "HOT" },
                { label: "3-Seater Family Sofas", href: "/categories/sofas?seats=3" },
                { label: "2-Seater Compact Sofas", href: "/categories/sofas?seats=2" },
                { label: "Modular Sectionals", href: "/categories/sofas?type=modular", badge: "NEW" },
                { label: "Luxury Sofa Beds", href: "/categories/sofas?type=sofa-bed" },
              ],
            },
            {
              title: "Chairs & Accents",
              links: [
                { label: "All Accent Armchairs", href: "/categories/armchairs", badge: "POPULAR" },
                { label: "Deep-Seat Bouclé Loungers", href: "/categories/armchairs?material=boucle" },
                { label: "Matte Velvet Snugglers", href: "/categories/armchairs?material=velvet" },
                { label: "Storage Footstools & Poufs", href: "/categories/armchairs?type=ottoman" },
                { label: "Sculptural Fireside Chairs", href: "/categories/armchairs" },
              ],
            },
            {
              title: "British Craft Fabrics",
              links: [
                { label: "Textured Bouclé Collections", href: "/categories/sofas?fabric=boucle" },
                { label: "Stain-Resistant Matte Velvet", href: "/categories/sofas?fabric=velvet" },
                { label: "Natural Belgian Linen", href: "/categories/sofas?fabric=linen" },
                { label: "Supple Italian Leather", href: "/categories/sofas?fabric=leather", badge: "PREMIUM" },
                { label: "Free Swatch Sample Service", href: "/delivery" },
              ],
            },
          ],
          featured_promo: {
            badge: "HANDCRAFTED UK",
            title: "The Sandringham Bouclé Sofa",
            subtitle: "Architectural proportions with pocket-sprung comfort and hardwood frame.",
            image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
            cta_label: "Explore Sandringham",
            cta_href: "/products/sandringham-large-sofa",
          },
          featured_product: {
            tag: "White Glove Delivery",
            title: "Sandringham Large Bouclé Sofa",
            price_str: "£1,495.00",
            image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
            href: "/products/sandringham-large-sofa",
          },
        },
        {
          id: "living",
          label: "Living Room",
          href: "/categories/living-tables",
          badge: "",
          columns: [
            {
              title: "Tables & Surfaces",
              links: [
                { label: "All Living Tables", href: "/categories/living-tables" },
                { label: "Statement Coffee Tables", href: "/categories/living-tables", badge: "BESTSELLER" },
                { label: "Nesting & Side Tables", href: "/categories/living-tables?type=nesting" },
                { label: "Architectural Console Tables", href: "/categories/living-tables?type=console" },
                { label: "Fluted Oak Center Tables", href: "/categories/living-tables?material=oak" },
              ],
            },
            {
              title: "Storage & Desks",
              links: [
                { label: "High-Gloss Sideboards", href: "/categories/living-tables?type=sideboard" },
                { label: "Media Consoles & TV Units", href: "/catalog?search=tv" },
                { label: "Oslo Scandinavian Desks", href: "/products/oslo-scandinavian-minimalist-writing-desk", badge: "NEW" },
                { label: "White Gloss Bookcases", href: "/products/zing-white-gloss-bookcase-2439" },
                { label: "Madrid Tall Chest of Drawers", href: "/products/madrid-white-gloss-tall-chest-of-drawers-2429" },
              ],
            },
            {
              title: "Curated Aesthetics",
              links: [
                { label: "Nordic Minimalist Living", href: "/catalog?filter=scandi" },
                { label: "Contemporary Alpine Gloss", href: "/catalog?filter=gloss" },
                { label: "Modern European Oak", href: "/catalog?filter=oak" },
                { label: "Compact Living Room Ideas", href: "/catalog" },
              ],
            },
          ],
          featured_promo: {
            badge: "DANISH SERIES",
            title: "Oslo Scandinavian Desk",
            subtitle: "Clean architectural lines with 3 stationery drawers engineered for home working.",
            image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop",
            cta_label: "View Oslo Desk",
            cta_href: "/products/oslo-scandinavian-minimalist-writing-desk",
          },
          featured_product: {
            tag: "In Stock UK",
            title: "Oslo Minimalist Writing Desk",
            price_str: "£249.00",
            image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop",
            href: "/products/oslo-scandinavian-minimalist-writing-desk",
          },
        },
        {
          id: "dining",
          label: "Dining Room",
          href: "/categories/dining",
          badge: "",
          columns: [
            {
              title: "Dining Tables",
              links: [
                { label: "All Dining Tables", href: "/categories/dining" },
                { label: "Extending Dining Tables", href: "/products/modena-extending-dining-table-high-gloss", badge: "POPULAR" },
                { label: "6 to 8 Seater Tables", href: "/categories/dining?seats=6-8" },
                { label: "Round Dining Tables", href: "/categories/dining?shape=round" },
                { label: "High-Gloss Modern Tables", href: "/categories/dining?finish=gloss" },
                { label: "Solid European Oak Tables", href: "/categories/dining?material=oak" },
              ],
            },
            {
              title: "Dining Seating",
              links: [
                { label: "Upholstered Dining Chairs", href: "/categories/dining?type=chairs" },
                { label: "Velvet Dining Chairs", href: "/categories/dining?fabric=velvet" },
                { label: "Dining Benches", href: "/categories/dining?type=benches" },
                { label: "Breakfast Bar Stools", href: "/categories/dining?type=stools", badge: "NEW" },
                { label: "Carver & Armchair Seating", href: "/categories/dining" },
              ],
            },
            {
              title: "Entertaining & Hosting",
              links: [
                { label: "Complete 6-Piece Sets", href: "/categories/dining" },
                { label: "Stain-Resistant Family Dining", href: "/categories/dining" },
                { label: "Compact Apartment Dining", href: "/categories/dining" },
                { label: "Display Cabinets & Buffets", href: "/catalog?search=bookcase" },
              ],
            },
          ],
          featured_promo: {
            badge: "GERMAN MECHANISM",
            title: "Modena Extending Dining Table",
            subtitle: "Seats 6 to 8 guests comfortably with smooth butterfly extension.",
            image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop",
            cta_label: "Explore Modena Table",
            cta_href: "/products/modena-extending-dining-table-high-gloss",
          },
          featured_product: {
            tag: "Pallet Delivery",
            title: "Modena Extending Dining Table",
            price_str: "£499.00",
            image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop",
            href: "/products/modena-extending-dining-table-high-gloss",
          },
        },
        {
          id: "bedroom",
          label: "Bedroom",
          href: "/categories/beds",
          badge: "",
          columns: [
            {
              title: "Beds & Mattresses",
              links: [
                { label: "All Beds & Headboards", href: "/categories/beds" },
                { label: "Gas-Lift Ottoman Beds", href: "/categories/beds?type=ottoman", badge: "HOT" },
                { label: "King Size Beds (5ft)", href: "/categories/beds?size=king" },
                { label: "Double Beds (4ft 6in)", href: "/categories/beds?size=double" },
                { label: "Super King Bedsteads (6ft)", href: "/categories/beds?size=super-king" },
                { label: "Bouclé Upholstered Frames", href: "/categories/beds?material=boucle" },
              ],
            },
            {
              title: "Wardrobes & Chests",
              links: [
                { label: "All Bedroom Storage", href: "/categories/beds" },
                { label: "Paris Mirrored 3-Door Wardrobe", href: "/products/paris-3-door-mirrored-wardrobe-matt-white", badge: "BESTSELLER" },
                { label: "Copenhagen Solid Oak Chest", href: "/products/copenhagen-4-drawer-deep-chest-danish-oak" },
                { label: "Venice Alpine White Bedside", href: "/products/venice-alpine-white-bedside-2394" },
                { label: "Louise White Gloss Bedside", href: "/products/louise-white-gloss-bedside-table-2413" },
                { label: "Madrid Sliding Wardrobe Drawers", href: "/products/madrid-wardrobe-internal-drawers-2428" },
              ],
            },
            {
              title: "Bedroom Collections",
              links: [
                { label: "Danish Oak Bedroom Suite", href: "/products/copenhagen-4-drawer-deep-chest-danish-oak" },
                { label: "Parisian White Mirrored Range", href: "/products/paris-3-door-mirrored-wardrobe-matt-white" },
                { label: "Contemporary Gloss Ensembles", href: "/products/louise-white-gloss-bedside-table-2413" },
                { label: "Under-Bed Storage Solutions", href: "/categories/beds" },
              ],
            },
          ],
          featured_promo: {
            badge: "CLASSIC DANISH",
            title: "Paris 3-Door Mirrored Wardrobe",
            subtitle: "Full-length bevelled mirrors with hanging rails and 2 deep bottom drawers.",
            image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
            cta_label: "View Paris Wardrobe",
            cta_href: "/products/paris-3-door-mirrored-wardrobe-matt-white",
          },
          featured_product: {
            tag: "Solid Danish Oak",
            title: "Copenhagen 4-Drawer Deep Chest",
            price_str: "£219.00",
            image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop",
            href: "/products/copenhagen-4-drawer-deep-chest-danish-oak",
          },
        },
        {
          id: "collections",
          label: "Collections & Offers",
          href: "/catalog",
          badge: "SALE",
          columns: [
            {
              title: "Featured Series",
              links: [
                { label: "Complete Catalog (All 38+ Pieces)", href: "/catalog" },
                { label: "Danish Scandinavian Oak", href: "/products/copenhagen-4-drawer-deep-chest-danish-oak", badge: "HOT" },
                { label: "Modern European High Gloss", href: "/products/modena-extending-dining-table-high-gloss" },
                { label: "Parisian Classic Mirrored", href: "/products/paris-3-door-mirrored-wardrobe-matt-white" },
                { label: "New Showroom Arrivals 2026", href: "/catalog?filter=new", badge: "NEW" },
              ],
            },
            {
              title: "Clearance & Savings",
              links: [
                { label: "Showroom Clearance Lines", href: "/catalog", badge: "UP TO 40% OFF" },
                { label: "Bedside Table Value Multi-Packs", href: "/categories/beds" },
                { label: "Dining Suite Packages", href: "/categories/dining" },
                { label: "Interior Designer & Trade Orders", href: "/delivery" },
              ],
            },
            {
              title: "Customer Care & Delivery",
              links: [
                { label: "Mainland UK Delivery Guide", href: "/delivery" },
                { label: "Furniture Care & Maintenance", href: "/delivery" },
                { label: "Assembly Guides & Proportions", href: "/delivery" },
                { label: "Customer Concierge Support", href: "/contact" },
              ],
            },
          ],
          featured_promo: {
            badge: "SPECIAL SAVINGS",
            title: "Showroom Seasonal Clearance",
            subtitle: "Limited UK warehouse stock ready for direct tracked dispatch.",
            image_url: "https://files.ekmcdn.com/amosmann1/images/venice-alpine-white-bedside-2394-2394-p.jpg",
            cta_label: "Shop All Special Offers",
            cta_href: "/catalog",
          },
          featured_product: {
            tag: "Limited Stock",
            title: "Venice Alpine White Bedside",
            price_str: "£110.46",
            original_price_str: "£145.00",
            image_url: "https://files.ekmcdn.com/amosmann1/images/venice-alpine-white-bedside-2394-2394-p.jpg",
            href: "/products/venice-alpine-white-bedside-2394",
          },
        },
      ],
      bottom_perks: [
        { icon: "Truck", text: "Free Delivery Across Mainland UK on All Orders" },
        { icon: "ShieldCheck", text: "UK Quality Checked & Durability Tested" },
        { icon: "CreditCard", text: "Zero Hidden Fees & Secure Card Checkout" },
      ],
    }),
  },

  // ==========================================
  // 2. HOMEPAGE
  // ==========================================
  {
    id: "sec_home_hero",
    page_key: "home",
    section_key: "home_hero",
    section_name: "Hero Showcase & Main Headline",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      rating_score: "4.9/5 from 2,800+ UK Homeowners",
      trustpilot_badge: "Trustpilot Rated Excellent",
      headline_line1: "Bespoke Living,",
      headline_line2: "Handcrafted for Britain.",
      description: "Discover tactile textured bouclés, solid European white oak tables, and luxury gas-lift ottoman beds. Enjoy direct UK mainland delivery and premium craftsmanship straight to your home.",
      primary_cta_text: "Explore All Products",
      primary_cta_link: "/catalog",
      secondary_cta_text: "Shop By Room",
      secondary_cta_link: "#collection-grid",
      trust_items: [
        { icon: "Truck", label: "UK Mainland Delivery" },
        { icon: "ShieldCheck", label: "UK Quality Checked & Tested" },
        { icon: "CreditCard", label: "Secure Card Checkout" },
      ],
      featured_badge: "Featured Masterpiece",
      hero_product_1_id: "",
      hero_product_2_id: "",
      hero_product_3_id: "",
      background_image_url: "",
      background_image_opacity: 15,
      background_color: "#f5f1e9",
      background_color_opacity: 75,
    }),
  },
  {
    id: "sec_home_trust_strip",
    page_key: "home",
    section_key: "home_trust_strip",
    section_name: "Trust & Assurance Cards",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      cards: [
        {
          title: "Direct-to-Door UK Delivery",
          description: "Specialist room-of-choice and pallet dispatch across Mainland UK.",
          badge: "Mainland UK",
        },
        {
          title: "Rigorous UK Quality Standards",
          description: "Engineered for British living rooms with certified durability.",
          badge: "100% Tested",
        },
        {
          title: "Free Mainland Delivery",
          description: "Complimentary direct delivery within 15 days across Mainland UK.",
          badge: "Free Delivery",
        },
        {
          title: "Safe & Encrypted Checkout",
          description: "256-Bit SSL protected with Visa, Mastercard, American Express & Maestro.",
          badge: "SSL Encrypted",
        },
      ],
    }),
  },
  {
    id: "sec_home_catalog_filter",
    page_key: "home",
    section_key: "home_catalog_filter",
    section_name: "Room Filter & Product Grid Header",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify({
      eyebrow: "Live Catalog Filter",
      heading: "Shop Handcrafted British Furniture",
      subheading_prefix: "Showing",
      subheading_suffix: "pieces ready for UK dispatch",
      products_per_page: 16,
      product_sort_order: "desc",
      show_view_more: true,
      view_more_text: "View More",
    }),
  },
  {
    id: "sec_home_curated_suite",
    page_key: "home",
    section_key: "home_curated_suite",
    section_name: "Curated Room Suite (Shop The Look)",
    is_enabled: 1,
    sort_order: 4,
    content_json: JSON.stringify({
      eyebrow: "Room Inspiration",
      title: "Shop The Contemporary Storage & Wardrobe Suite",
      description: "A masterfully coordinated ensemble featuring our German-engineered sliding wardrobe, high-gloss tall chest of drawers, and soft-closing bedside tables.",
      image_url: "https://files.ekmcdn.com/amosmann1/images/madrid-sliding-door-wardrobe-120cm-gloss-white-2461-2461-p.png",
      badge_text: "Curated 3-Piece Storage Suite",
      list_title: "Pieces in this setting:",
    }),
  },
  {
    id: "sec_home_promotions",
    page_key: "home",
    section_key: "home_promotions",
    section_name: "Special Savings & Promotional Showcase",
    is_enabled: 1,
    sort_order: 5,
    content_json: JSON.stringify({
      eyebrow: "Limited Stock Promotions",
      heading: "Special Savings on Signature Pieces",
      cta_text: "View all promotional offers",
      cta_link: "/catalog",
      badge_text: "Low UK stock",
    }),
  },
  {
    id: "sec_home_new_arrivals",
    page_key: "home",
    section_key: "home_new_arrivals",
    section_name: "New Arrivals Spotlight Banner",
    is_enabled: 1,
    sort_order: 6,
    content_json: JSON.stringify({
      eyebrow: "Just Arrived in Showroom",
      heading: "New Bedroom & Occasional Additions",
      badge_text: "NEW 2026",
      cta_text: "Explore all new arrivals",
      cta_link: "/catalog",
    }),
  },
  {
    id: "sec_home_reviews",
    page_key: "home",
    section_key: "home_reviews",
    section_name: "Homeowners Reviews Heading",
    is_enabled: 1,
    sort_order: 7,
    content_json: JSON.stringify({
      eyebrow: "Real Homes & Experiences",
      heading: "What British Homeowners Say",
      rating_score: "4.9 / 5.0",
      source_label: "Trustpilot & Google Customer Feedback",
    }),
  },
  {
    id: "sec_home_newsletter",
    page_key: "home",
    section_key: "home_newsletter",
    section_name: "VIP Newsletter & Private Sales",
    is_enabled: 1,
    sort_order: 8,
    content_json: JSON.stringify({
      eyebrow: "The SAN Private Circle",
      title: "Receive £50 Off Your First Order Over £500",
      subtitle: "Join our UK private collectors list for early access to limited edition drops, seasonal showroom previews, and interior design curations.",
      placeholder: "Enter your personal email address...",
      button_text: "Claim Voucher",
      disclaimer: "No spam. Unsubscribe at any time. Strictly adhering to UK GDPR 2018.",
    }),
  },

  // ==========================================
  // 3. CATALOG & COLLECTIONS
  // ==========================================
  {
    id: "sec_catalog_header",
    page_key: "catalog",
    section_key: "catalog_header",
    section_name: "Catalog Page Banner & Hero Text",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      eyebrow: "Architectural Curations",
      title: "The Complete Furniture Collection",
      subtitle: "Explore our full curation of solid hardwood dining sets, textured bouclé sofas, sculptural accent chairs, and ottoman storage beds. Every piece is rigorously tested and delivered direct to your door.",
      vat_badge: "All items include 20% UK VAT with direct delivery tracking",
    }),
  },
  {
    id: "sec_catalog_filter_bar",
    page_key: "catalog",
    section_key: "catalog_filter_bar",
    section_name: "Catalog Filters & Zero State Copy",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      empty_title: "No Matching Furniture Pieces Found",
      empty_description: "We could not find any active pieces matching your current facet filters. Please clear one or more criteria to view our available British ranges.",
      reset_button_label: "Clear All Active Filters",
      sort_options_label: "Sort Catalog By",
    }),
  },

  // ==========================================
  // 4. PRODUCT DETAIL PAGE (PDP)
  // ==========================================
  {
    id: "sec_pdp_value_badges",
    page_key: "product_detail",
    section_key: "pdp_value_badges",
    section_name: "Guarantees & Reassurance Badges",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      badges: [
        {
          icon: "Truck",
          title: "Free Mainland Delivery",
          subtitle: "Direct to your door within 15 days across Mainland UK",
          description: "Direct to your door within 15 days across Mainland UK",
        },
        {
          icon: "ShieldCheck",
          title: "UK Quality Checked",
          subtitle: "Rigorous structural durability & quality inspection",
          description: "Rigorous structural durability & quality inspection",
        },
        {
          icon: "CreditCard",
          title: "Secure Card Checkout",
          subtitle: "256-bit encrypted checkout via Stripe UK",
          description: "256-bit encrypted checkout via Stripe UK",
        },
      ],
    }),
  },
  {
    id: "sec_pdp_delivery_info",
    page_key: "product_detail",
    section_key: "pdp_delivery_info",
    section_name: "Delivery Tiers & Postcode Checker Info",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      box_title: "UK Delivery & Postcode Estimator",
      free_threshold_notice: "Free Free White Glove delivery automatically applies on orders over £500 across Mainland UK.",
      regional_surcharge_notice: "Scottish Highlands (IV, KW, HS) and Northern Ireland (BT) incur standard carrier surcharges calculated at checkout.",
      room_of_choice_label: "Delivered directly to your room of choice with packaging removal.",
    }),
  },
  {
    id: "sec_pdp_clearance_guide",
    page_key: "product_detail",
    section_key: "pdp_clearance_guide",
    section_name: "Dimensions & Doorway Clearance Advisory",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify({
      guide_title: "Will This Fit In Your Home?",
      clearance_tips: [
        "Measure all doorway widths, stairwell turns, and hallway clearances before order dispatch.",
        "Check that your ceiling height clears vertical delivery boxes if ordering tall wardrobes.",
        "Our specialist delivery crews can inspect access points upon arrival prior to room positioning.",
      ],
      helpline_prompt: "Need exact box dimensions? Call our delivery dispatch desk: +44 20 7946 0192.",
    }),
  },
  {
    id: "sec_pdp_finance_perks",
    page_key: "product_detail",
    section_key: "pdp_finance_perks",
    section_name: "Financing Options (Klarna/Pay in 3) & Payment Badges",
    is_enabled: 1,
    sort_order: 4,
    content_json: JSON.stringify({
      financing_headline: "Spread the cost with 0% APR options",
      financing_providers: "Klarna • Clearpay",
      vat_included_notice: "Transparent British Luxury. Zero hidden charges.",
      security_seal_text: "256-Bit Bank Grade SSL Encrypted Checkout",
    }),
  },

  // ==========================================
  // 5. BASKET & CART DRAWER
  // ==========================================
  {
    id: "sec_cart_threshold_banner",
    page_key: "cart",
    section_key: "cart_threshold_banner",
    section_name: "Free Delivery Progress Bar & Messages",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      threshold_amount_gbp: 500,
      unqualified_message: "Add {amount_remaining} more for Free White Glove Delivery!",
      qualified_message: "You have unlocked Free UK White Glove Delivery!",
      vat_summary_label: "Inclusive Transparent UK Pricing",
    }),
  },
  {
    id: "sec_cart_trust_guarantees",
    page_key: "cart",
    section_key: "cart_trust_guarantees",
    section_name: "Cart Drawer Trust Badges",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      guarantees: [
        "Mainland delivery updates sent via SMS & Email",
        "Free Mainland Delivery within 15 days",
        "Dedicated UK concierge assistance for assembly and care instructions",
      ],
      checkout_button_label: "Proceed to Secure UK Checkout",
    }),
  },

  // ==========================================
  // 6. CHECKOUT PAGE
  // ==========================================
  {
    id: "sec_checkout_header_badge",
    page_key: "checkout",
    section_key: "checkout_header_badge",
    section_name: "Safe & Compliant UK Checkout Banner",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      banner_title: "Official SAN UK Commerce Gateway",
      ssl_guarantee: "256-Bit Encrypted • PCI-DSS Level 1 Compliant",
      vat_invoice_claim: "A transparent digital order confirmation with full itemised breakdown will be sent upon payment confirmation.",
    }),
  },
  {
    id: "sec_checkout_delivery_guide",
    page_key: "checkout",
    section_key: "checkout_delivery_guide",
    section_name: "Delivery Tiers & Surcharges Guidance",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      standard_tier_title: "Standard Tracked Parcel (£9.99 or Free over £100)",
      pallet_tier_title: "Heavy Goods Pallet Delivery (£29.99 or Free over £500)",
      white_glove_title: "Room of Choice White Glove (£49.99 or Free over £500)",
      surcharge_disclaimer: "Deliveries to Scottish Highlands, Isle of Man, and Northern Ireland are subject to automated regional surcharges.",
    }),
  },

  // ==========================================
  // 7. FOOTER
  // ==========================================
  {
    id: "sec_footer_assurance",
    page_key: "footer",
    section_key: "footer_assurance",
    section_name: "4 Pillars of UK Customer Confidence",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      pillars: [
        {
          icon: "Truck",
          title: "UK Mainland Delivery",
          description: "Direct to your door across the UK Mainland.",
        },
        {
          icon: "RotateCcw",
          title: "Free Mainland Delivery",
          description: "Enjoy complimentary delivery across Mainland UK within 15 days.",
        },
        {
          icon: "Shield",
          title: "UK Quality Assured",
          description: "High-grade materials and rigorous structural quality testing for long-lasting home durability.",
        },
        {
          icon: "Sparkles",
          title: "Secure Card Payments",
          description: "Protected 256-bit SSL encrypted checkout accepting Visa, Mastercard, American Express and Maestro.",
        },
      ],
    }),
  },
  {
    id: "sec_footer_brand_info",
    page_key: "footer",
    section_key: "footer_brand_info",
    section_name: "Brand Story & UK Customer Care Hours",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      brand_bio: "Delivering contemporary home furniture, durable craftsmanship, and dedicated customer support straight to Mainland UK homes.",
      support_title: "Customer Support (UK)",
      support_hours: "Monday – Friday: 09:00 – 18:00 GMT",
      support_email: "support@sanfurniture.com",
      support_phone: "+44 20 7946 0192",
      legal_note: "SAN Furniture UK • Modern Living, Exceptional Quality & Free Mainland Delivery",
    }),
  },
  {
    id: "sec_footer_payment_trust",
    page_key: "footer",
    section_key: "footer_payment_trust",
    section_name: "Payment Trust Badges & Secure Checkout",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify({
      company_number: "",
      copyright_text: "© 2026 SAN Furniture. All rights reserved.",
      positive_copy: "SAN Furniture UK • Contemporary Home Living, Exceptional Quality & Free Mainland Delivery.",
      accepted_methods: ["Visa", "Mastercard", "American Express", "Maestro"],
    }),
  },

  // ==========================================
  // 8. ABOUT US
  // ==========================================
  {
    id: "sec_about_hero",
    page_key: "about",
    section_key: "about_hero",
    section_name: "Quality Living & Modern Furniture",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      eyebrow: "Our Heritage & Philosophy",
      title: "Modern Living, Engineered for Everyday Comfort",
      story: "Founded to deliver thoughtfully designed, high-quality home furniture directly to UK doorsteps without inflated retail markups. From sturdy dining sets to modular storage chests and elegant living furniture, every piece is built for real everyday homes.",
      highlight_stat_1: "15,000+ Homes Furnished Across the UK",
      highlight_stat_2: "Rigorous Structural Durability Checks",
      highlight_stat_3: "100% Quality Inspected Prior to Dispatch",
    }),
  },
  {
    id: "sec_about_sustainability",
    page_key: "about",
    section_key: "about_sustainability",
    section_name: "FSC Timber & Ethical Sourcing",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      title: "Sustainable Forestry & Responsible Materials",
      description: "We partner exclusively with certified sawmills across Europe and the UK that practice sustainable forestry under strict FSC and PEFC guidelines. Our foams are non-toxic, and our fabrics are free from hazardous fluorocarbons.",
      bullet_1: "FSC-Certified Solid European Oak & American Walnut",
      bullet_2: "Non-toxic high-density reflex foams",
      bullet_3: "Eco-conscious packaging with cardboard recycling collection",
    }),
  },

  // ==========================================
  // 9. DELIVERY & RETURNS POLICY
  // ==========================================
  {
    id: "sec_delivery_tiers_guide",
    page_key: "delivery_returns",
    section_key: "delivery_tiers_guide",
    section_name: "Delivery Tiers & Service Expectations",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      title: "Specialist UK Furniture Logistics",
      lead_time_summary: "Mainland UK deliveries are typically completed within 7 to 14 business days. Pre-delivery booking calls are made 48 hours prior to dispatch.",
      tier_1_title: "1. Standard Parcel (Small Items)",
      tier_1_desc: "Tracked next-day courier delivery for lamps, cushions, stools, and care kits.",
      tier_2_title: "2. Heavy Goods Pallet Delivery",
      tier_2_desc: "Kerbside palletized delivery for solid wood dining tables and flatpack modular storage.",
      tier_3_title: "3. Two-Man White Glove Service",
      tier_3_desc: "Delivered into your room of choice, unpackaged, and inspected. Packaging materials are removed for recycling.",
    }),
  },
  {
    id: "sec_returns_policy",
    page_key: "delivery_returns",
    section_key: "returns_policy",
    section_name: "14-Day Returns & Collection Terms",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      title: "14-Day Peace of Mind Return Policy",
      cooling_off_notice: "In full accordance with the UK Consumer Contracts Regulations 2013, you have 14 days from the date of delivery to notify us if you wish to return an item.",
      collection_procedure: "Contact our Leicester logistics desk, and we will schedule our specialist carrier to collect the piece directly from your home.",
      condition_requirement: "Items must be returned in resalable condition in original packaging. Refunds are processed within 3-5 business days upon warehouse inspection.",
    }),
  },

  // ==========================================
  // 10. CONTACT & FAQS
  // ==========================================
  {
    id: "sec_contact_details",
    page_key: "contact_faq",
    section_key: "contact_details",
    section_name: "Concierge Contact & Warehouse Address",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      page_title: "Customer Concierge & Support Desk",
      page_subtitle: "Our UK support team is available Monday through Saturday to answer questions regarding orders, product specifications, or room dimensions.",
      phone: "+44 (0) 20 7946 0192",
      email: "concierge@sanfurniture.com",
      whatsapp: "+44 7700 900821",
      hours: "Monday – Friday: 08:30 – 18:30 GMT | Saturday: 09:00 – 16:00 GMT",
      warehouse_address: "SAN Furniture Logistics Hub, Unit 4 Meridian Business Park, Leicester LE19 1RJ, United Kingdom",
    }),
  },
  {
    id: "sec_faq_list",
    page_key: "contact_faq",
    section_key: "faq_list",
    section_name: "Frequently Asked Questions",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      faqs: [
        {
          question: "How long does UK delivery take?",
          answer: "Most items are dispatched directly from our UK supplier warehouses within 3-5 business days and delivered to your doorstep within 10-15 business days. You will receive shipment tracking notifications.",
        },
        {
          question: "How is my furniture packaged and delivered?",
          answer: "Every piece is carefully boxed in reinforced flat-pack protective packaging with corner buffers, and dispatched directly across Mainland UK within 10-15 business days.",
        },
        {
          question: "What delivery service is provided?",
          answer: "We provide free delivery across Mainland UK directly to your doorstep with pre-delivery dispatch updates.",
        },
        {
          question: "Will I receive an itemised order receipt?",
          answer: "Yes, an official itemised digital order receipt with complete product codes, quantities, and order reference will be emailed upon payment confirmation.",
        },
      ],
    }),
  },

  // ==========================================
  // 11. CLIENT ACCOUNT PORTAL
  // ==========================================
  {
    id: "sec_account_welcome_banner",
    page_key: "account",
    section_key: "account_welcome_banner",
    section_name: "Client Portal Banner & Privileges",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      welcome_title: "SAN Client Portal",
      welcome_subtitle: "Manage your active furniture orders, download official order receipts, review assembly guides, and track mainland dispatches.",
      vip_perk_badge: "UK Verified Client",
      support_shortcut_text: "Need urgent delivery rescheduling? Speak to dispatch directly via our live helpdesk.",
    }),
  },
];;
