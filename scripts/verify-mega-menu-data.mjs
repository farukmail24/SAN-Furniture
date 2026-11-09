import { resolveSubType, FURNITURE_SUBTYPES } from '../packages/types/dist/taxonomy.js';

export const cleanMegaMenuContent = {
  tabs: [
    {
      id: "living",
      label: "Living Room",
      href: "/living-room",
      badge: "",
      columns: [
        {
          title: "Tables & Surfaces",
          links: [
            { label: "All Living Room Pieces", href: "/living-room" },
            { label: "Statement Coffee Tables", href: "/living-room?type=coffee-tables", badge: "BESTSELLER" },
            { label: "Nesting & Side Tables", href: "/living-room?type=side-tables" },
            { label: "Architectural Console Tables", href: "/living-room?type=console-tables" },
            { label: "Fluted Center Tables", href: "/living-room?type=nesting-tables" },
          ],
        },
        {
          title: "Living Storage & Media",
          links: [
            { label: "Media Consoles & TV Units", href: "/living-room?type=tv-units", badge: "POPULAR" },
            { label: "Bookcases & Open Shelving", href: "/living-room?type=bookcases" },
            { label: "High-Gloss Sideboards", href: "/living-room?type=sideboards" },
            { label: "Shoe & Hallway Cabinets", href: "/living-room?type=storage-cabinets" },
            { label: "Multi-Tier Display Units", href: "/living-room?type=display-cabinets" },
          ],
        },
        {
          title: "Living Seating & Accents",
          links: [
            { label: "Accent Armchairs & Stools", href: "/living-room?type=armchairs", badge: "POPULAR" },
            { label: "Swivel Lounge Chairs", href: "/living-room?type=swivel-chairs" },
            { label: "Fireside & Wingback Chairs", href: "/living-room?type=fireside-chairs" },
            { label: "Storage Footstools & Poufs", href: "/living-room?type=stools-poufs" },
            { label: "Living Wall Mirrors", href: "/living-room?type=mirrors" },
          ],
        },
      ],
      featured_promo: {
        badge: "HIGH GLOSS",
        title: "Pietra Media Console & TV Unit",
        subtitle: "Concealed wire routing and soft-close storage for modern British homes.",
        image_url: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80",
        cta_label: "View Media Consoles",
        cta_href: "/living-room?type=tv-units",
      },
      featured_product: {
        tag: "Living Collection",
        title: "Chelsea High-Gloss Sideboard",
        price_str: "£289.00",
        image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=800&q=80",
        href: "/living-room?type=sideboards",
      },
    },
    {
      id: "sofas",
      label: "Sofas",
      href: "/sofas",
      badge: "",
      columns: [
        {
          title: "Sofas By Style",
          links: [
            { label: "All Sofas & Couches", href: "/sofas" },
            { label: "Corner & L-Shape Lounges", href: "/sofas?type=corner-sofas", badge: "HOT" },
            { label: "3-Seater Family Sofas", href: "/sofas?type=3-seater" },
            { label: "2-Seater Compact Sofas", href: "/sofas?type=2-seater" },
            { label: "Modular Sectionals", href: "/sofas?type=modular", badge: "NEW" },
            { label: "Luxury Sofa Beds", href: "/sofas?type=sofa-beds" },
          ],
        },
        {
          title: "Chairs & Accents",
          links: [
            { label: "All Accent Armchairs", href: "/living-room?type=armchairs", badge: "POPULAR" },
            { label: "Swivel Lounge Chairs", href: "/living-room?type=swivel-chairs" },
            { label: "Mid-Century Lounge Chairs", href: "/living-room?type=lounge-chairs" },
            { label: "Storage Footstools & Poufs", href: "/living-room?type=stools-poufs" },
            { label: "Sculptural Fireside Chairs", href: "/living-room?type=fireside-chairs" },
          ],
        },
        {
          title: "British Craft Fabrics",
          links: [
            { label: "Textured Bouclé Collections", href: "/sofas?fabric=boucle" },
            { label: "Stain-Resistant Matte Velvet", href: "/sofas?fabric=velvet" },
            { label: "Natural Belgian Linen", href: "/sofas?fabric=linen" },
            { label: "Supple Italian Leather", href: "/sofas?fabric=leather", badge: "PREMIUM" },
            { label: "Free Swatch Sample Service", href: "/swatches" },
          ],
        },
      ],
      featured_promo: {
        badge: "HANDCRAFTED UK",
        title: "The Sandringham Bouclé Sofa",
        subtitle: "Architectural proportions with pocket-sprung comfort and hardwood frame.",
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        cta_label: "Explore Sandringham",
        cta_href: "/products/sandringham-large-boucl-3-seater-sofa",
      },
      featured_product: {
        tag: "Room of Choice Delivery",
        title: "Sandringham Large Bouclé Sofa",
        price_str: "£1,495.00",
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        href: "/products/sandringham-large-boucl-3-seater-sofa",
      },
    },
    {
      id: "dining",
      label: "Dining",
      href: "/dining",
      badge: "",
      columns: [
        {
          title: "Dining Tables",
          links: [
            { label: "All Dining Collections", href: "/dining" },
            { label: "Extending Dining Tables", href: "/dining?type=extending-tables", badge: "POPULAR" },
            { label: "Round Dining Tables", href: "/dining?type=round-tables" },
            { label: "Rectangular Dining Tables", href: "/dining?type=dining-tables" },
            { label: "Breakfast & Bar Tables", href: "/dining?type=bar-tables" },
          ],
        },
        {
          title: "Dining Seating",
          links: [
            { label: "Upholstered Dining Chairs", href: "/dining?type=dining-chairs", badge: "POPULAR" },
            { label: "Dining Benches", href: "/dining?type=dining-benches" },
            { label: "Breakfast Bar Stools", href: "/dining?type=bar-stools", badge: "NEW" },
            { label: "Velvet Dining Chairs", href: "/dining?type=dining-chairs&fabric=velvet" },
            { label: "Solid Oak Dining Chairs", href: "/dining?type=dining-chairs&material=oak" },
          ],
        },
        {
          title: "Entertaining & Hosting",
          links: [
            { label: "Complete Dining Sets", href: "/dining?type=dining-sets", badge: "VALUE" },
            { label: "Sideboards & Buffets", href: "/living-room?type=sideboards" },
            { label: "Display Cabinets & Dressers", href: "/living-room?type=display-cabinets" },
            { label: "Family 6-8 Seater Dining", href: "/dining?capacity=6-8" },
          ],
        },
      ],
      featured_promo: {
        badge: "GERMAN MECHANISM",
        title: "Modena Extending Dining Table",
        subtitle: "Seats 6 to 8 guests comfortably with smooth butterfly extension.",
        image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop",
        cta_label: "Explore Modena Table",
        cta_href: "/products/modena-high-gloss-extending-6-8-seater-dining-table",
      },
      featured_product: {
        tag: "Pallet Delivery",
        title: "Modena Extending Dining Table",
        price_str: "£499.00",
        image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop",
        href: "/products/modena-high-gloss-extending-6-8-seater-dining-table",
      },
    },
    {
      id: "bedroom",
      label: "Bedroom",
      href: "/bedroom",
      badge: "",
      columns: [
        {
          title: "Beds & Mattresses",
          links: [
            { label: "All Bedroom Collections", href: "/bedroom" },
            { label: "Gas-Lift Ottoman Beds", href: "/bedroom?type=ottoman-beds", badge: "HOT" },
            { label: "King Size Beds (5ft)", href: "/bedroom?type=king-beds" },
            { label: "Double Beds (4ft 6in)", href: "/bedroom?type=double-beds" },
            { label: "Single Bedsteads (3ft)", href: "/bedroom?type=single-beds" },
            { label: "All Beds & Bedsteads", href: "/bedroom?type=beds" },
          ],
        },
        {
          title: "Wardrobes & Storage",
          links: [
            { label: "Sliding Door Wardrobes", href: "/bedroom?type=sliding-wardrobes", badge: "BESTSELLER" },
            { label: "Mirrored Wardrobes", href: "/bedroom?type=mirrored-wardrobes" },
            { label: "All Hinged Wardrobes", href: "/bedroom?type=wardrobes" },
            { label: "Chests of Drawers", href: "/bedroom?type=chest-of-drawers" },
            { label: "Bedside Tables", href: "/bedroom?type=bedside-tables" },
            { label: "Multi-Purpose Storage Cupboards", href: "/bedroom?type=storage-cupboards" },
          ],
        },
        {
          title: "Bedroom Collections & Vanity",
          links: [
            { label: "Dressing Tables & Stools", href: "/bedroom?type=dressing-tables", badge: "NEW" },
            { label: "Dressing Mirrors & Accents", href: "/bedroom?type=mirrors" },
            { label: "Danish Oak Bedroom Suite", href: "/bedroom?material=oak" },
            { label: "Parisian White Gloss Range", href: "/bedroom?finish=white-gloss" },
            { label: "Madrid Sliding Wardrobe Series", href: "/bedroom?collection=madrid" },
          ],
        },
      ],
      featured_promo: {
        badge: "CLASSIC DANISH",
        title: "Paris 3-Door Mirrored Wardrobe",
        subtitle: "Full-length bevelled mirrors with hanging rails and 2 deep bottom drawers.",
        image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
        cta_label: "View Paris Wardrobe",
        cta_href: "/bedroom?type=wardrobes",
      },
      featured_product: {
        tag: "Solid Danish Oak",
        title: "Copenhagen 4-Drawer Deep Chest",
        price_str: "£219.00",
        image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop",
        href: "/bedroom?type=chest-of-drawers",
      },
    },
    {
      id: "kids",
      label: "Kids",
      href: "/kids",
      badge: "",
      columns: [
        {
          title: "Kids Beds & Bunks",
          links: [
            { label: "All Kids Furniture", href: "/kids" },
            { label: "Kids Bunk Beds", href: "/kids?type=bunk-beds", badge: "POPULAR" },
            { label: "Cabin & Mid Sleeper Beds", href: "/kids?type=mid-sleepers" },
            { label: "High Sleeper Workstation Beds", href: "/kids?type=high-sleepers" },
            { label: "Underbed Cabin Storage Beds", href: "/kids?type=cabin-beds" },
            { label: "Children's Single Beds", href: "/kids?type=kids-beds" },
          ],
        },
        {
          title: "Kids Wardrobes & Storage",
          links: [
            { label: "Kids Storage Wardrobes", href: "/kids?type=kids-wardrobes", badge: "POPULAR" },
            { label: "Compact Chests of Drawers", href: "/kids?type=kids-chests" },
            { label: "Toy Storage Boxes & Units", href: "/kids?type=toy-storage" },
            { label: "Kids Bookcases & Shelves", href: "/kids?type=kids-bookcases" },
            { label: "Kids Bedside Cabinets", href: "/kids?type=kids-bedside" },
            { label: "All Kids Storage & Units", href: "/kids?type=kids-storage" },
          ],
        },
        {
          title: "Kids Study & Desks",
          links: [
            { label: "Children's Study Desks", href: "/kids?type=kids-desks", badge: "NEW" },
            { label: "Kids Gaming Desks", href: "/kids?type=gaming-desks" },
            { label: "Ergonomic Student Chairs", href: "/kids?type=kids-chairs" },
            { label: "Complete Bedroom Sets", href: "/kids?type=kids-sets" },
            { label: "Nursery & Toddler Furniture", href: "/kids?type=kids-beds&age=nursery" },
          ],
        },
      ],
      featured_promo: {
        badge: "NURSERY & JUNIOR",
        title: "Kids Scandinavian Suite",
        subtitle: "Safe, rounded corners and statutory UK non-toxic timber finishes.",
        image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop",
        cta_label: "Explore Kids Furniture",
        cta_href: "/kids",
      },
      featured_product: {
        tag: "Junior Series",
        title: "Scandinavian Compact Study Desk",
        price_str: "£149.00",
        image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop",
        href: "/kids",
      },
    },
    {
      id: "office",
      label: "Office",
      href: "/office",
      badge: "",
      columns: [
        {
          title: "Desks & Workstations",
          links: [
            { label: "All Office Furniture", href: "/office" },
            { label: "Scandinavian Writing Desks", href: "/office?type=writing-desks", badge: "HOT" },
            { label: "Executive Desks with Drawers", href: "/office?type=executive-desks" },
            { label: "Corner & L-Shaped Desks", href: "/office?type=corner-desks" },
            { label: "Computer & Laptop Desks", href: "/office?type=computer-desks" },
            { label: "Compact Apartment Desks", href: "/office?type=compact-desks" },
          ],
        },
        {
          title: "Office Storage & Shelving",
          links: [
            { label: "Tall Office Bookcases", href: "/office?type=office-bookcases", badge: "POPULAR" },
            { label: "Filing & Storage Cupboards", href: "/office?type=filing-cabinets" },
            { label: "Under-Desk Pedestals", href: "/office?type=pedestals" },
            { label: "Office Storage Cabinets", href: "/office?type=office-storage" },
            { label: "All Desks & Workstations", href: "/office?type=desks" },
          ],
        },
        {
          title: "Seating & Workspaces",
          links: [
            { label: "Ergonomic Desk Chairs", href: "/office?type=office-chairs", badge: "RECOMMENDED" },
            { label: "Modern Ergonomic Workspaces", href: "/office?style=ergonomic" },
            { label: "High-Gloss Minimalist Studies", href: "/office?finish=white-gloss" },
            { label: "Solid European Oak Desks", href: "/office?material=oak" },
            { label: "Compact Study Nooks", href: "/office?size=compact" },
          ],
        },
      ],
      featured_promo: {
        badge: "DANISH SERIES",
        title: "Oslo Scandinavian Desk",
        subtitle: "Clean architectural lines with 3 stationery drawers engineered for home working.",
        image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop",
        cta_label: "View Oslo Desk",
        cta_href: "/office?type=desks",
      },
      featured_product: {
        tag: "In Stock UK",
        title: "Oslo Minimalist Writing Desk",
        price_str: "£249.00",
        image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop",
        href: "/office?type=desks",
      },
    },
    {
      id: "bathroom",
      label: "Bathroom",
      href: "/bathroom",
      badge: "",
      columns: [
        {
          title: "Vanity & Basin Units",
          links: [
            { label: "All Bathroom Furniture", href: "/bathroom" },
            { label: "Bathroom Vanity Sink Units", href: "/bathroom?type=vanity-units", badge: "POPULAR" },
            { label: "Undersink Storage Cupboards", href: "/bathroom?type=undersink-cabinets" },
            { label: "Countertop Basin Cabinets", href: "/bathroom?type=countertop-basins" },
            { label: "Floor Standing Vanity Units", href: "/bathroom?type=freestanding-vanity" },
          ],
        },
        {
          title: "Bathroom Storage",
          links: [
            { label: "Tall Narrow Cupboards", href: "/bathroom?type=tall-cabinets", badge: "BESTSELLER" },
            { label: "Wall Hanging Cabinets", href: "/bathroom?type=wall-cabinets" },
            { label: "Mirrored Bathroom Cabinets", href: "/bathroom?type=mirror-cabinets" },
            { label: "Freestanding Linen Cupboards", href: "/bathroom?type=bathroom-storage" },
            { label: "Bathroom Storage Shelves", href: "/bathroom?type=bathroom-shelves" },
          ],
        },
        {
          title: "Finishes & Craftsmanship",
          links: [
            { label: "Alpine High-Gloss White", href: "/bathroom?finish=gloss-white" },
            { label: "Natural Moisture-Resistant Oak", href: "/bathroom?material=oak" },
            { label: "Anthracite & Matte Grey", href: "/bathroom?finish=grey" },
            { label: "Compact En-Suite Solutions", href: "/bathroom?size=compact" },
            { label: "Soft-Close Premium Ranges", href: "/bathroom?feature=soft-close" },
          ],
        },
      ],
      featured_promo: {
        badge: "MOISTURE RESISTANT",
        title: "Milano Tall Narrow Cupboard",
        subtitle: "Space-saving high-gloss finish with reversible doors and internal shelving.",
        image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        cta_label: "Explore Bathroom",
        cta_href: "/bathroom",
      },
      featured_product: {
        tag: "High Gloss",
        title: "Milano Tall Bathroom Cupboard",
        price_str: "£159.10",
        image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        href: "/bathroom",
      },
    },
    {
      id: "sale",
      label: "Sale",
      href: "/sale",
      badge: "SALE",
      columns: [
        {
          title: "Clearance By Room",
          links: [
            { label: "All Sale & Clearance", href: "/sale" },
            { label: "Living Room Clearance", href: "/sale?category=living-room" },
            { label: "Bedroom & Bedding Savings", href: "/sale?category=bedroom" },
            { label: "Dining Suites on Offer", href: "/sale?category=dining" },
            { label: "Sofa & Lounge Discounts", href: "/sale?category=sofas" },
            { label: "Office & Workstation Deals", href: "/sale?category=office" },
          ],
        },
        {
          title: "Special Savings",
          links: [
            { label: "Showroom Clearance Lines", href: "/sale?discount=40", badge: "UP TO 40% OFF" },
            { label: "Bedside Table Value Multi-Packs", href: "/bedroom?type=bedside-tables" },
            { label: "Dining Suite Complete Packages", href: "/dining?type=dining-sets" },
            { label: "Trade & Bulk Purchase Discounts", href: "/contact?inquiry=trade" },
          ],
        },
        {
          title: "Customer Care & Guarantees",
          links: [
            { label: "Free Mainland UK Delivery", href: "/delivery" },
            { label: "Direct Workshop Pricing", href: "/about" },
            { label: "Statutory Safety Compliance", href: "/fire-safety" },
            { label: "Customer Concierge Support", href: "/contact" },
          ],
        },
      ],
      featured_promo: {
        badge: "SPECIAL SAVINGS",
        title: "Warehouse Seasonal Clearance",
        subtitle: "Limited UK warehouse stock ready for direct tracked dispatch.",
        image_url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop",
        cta_label: "Shop All Special Offers",
        cta_href: "/sale",
      },
      featured_product: {
        tag: "Clearance Deal",
        title: "Venice Alpine White Bedside",
        price_str: "£110.46",
        original_price_str: "£145.00",
        image_url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop",
        href: "/products/venice-alpine-white-bedside",
      },
    },
  ],
  bottom_perks: [
    { icon: "Truck", text: "Free Delivery Across Mainland UK on All Orders" },
    { icon: "ShieldCheck", text: "UK Quality Checked & Durability Tested" },
    { icon: "CreditCard", text: "Zero Hidden Fees & Secure Card Checkout" },
  ],
};

function verify() {
  let duplicates = 0;
  let unresolvedSubtypes = 0;

  for (const tab of cleanMegaMenuContent.tabs) {
    console.log(`\nChecking Tab: ${tab.label} (${tab.id})`);
    for (const col of tab.columns) {
      const seen = new Set();
      for (const link of col.links) {
        if (seen.has(link.href)) {
          console.error(`  ❌ DUPLICATE in [${tab.label} > ${col.title}]: ${link.label} -> ${link.href}`);
          duplicates++;
        }
        seen.add(link.href);

        // Check ?type= param resolution
        const url = new URL(link.href, 'http://localhost');
        const typeParam = url.searchParams.get('type');
        if (typeParam) {
          // Find categoryId from url pathname or tab id
          const pathSlug = url.pathname.replace(/^\//, '');
          const catMap = {
            'living-room': 'cat_living',
            living: 'cat_living',
            sofas: 'cat_sofas',
            dining: 'cat_dining',
            bedroom: 'cat_beds',
            kids: 'cat_kids',
            office: 'cat_office',
            bathroom: 'cat_bathroom'
          };
          const catId = catMap[pathSlug] || catMap[tab.id];
          const resolved = resolveSubType(catId, typeParam);
          if (!resolved) {
            console.warn(`  ⚠️ Could not resolve sub-type "${typeParam}" for category "${pathSlug || tab.id}" (${catId}) on link "${link.label}"`);
            unresolvedSubtypes++;
          }
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Audit Results: ${duplicates} Duplicates, ${unresolvedSubtypes} Unresolved Sub-Types`);
  console.log(`========================================`);

  if (duplicates > 0 || unresolvedSubtypes > 0) {
    process.exit(1);
  }
}

verify();
