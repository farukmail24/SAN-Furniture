import { type FaqItem } from "./schema-org-generator.js";

export interface ProgrammaticPageDefinition {
  slug: string;
  categoryHandle: string;
  materialFilter?: string;
  colorFilter?: string;
  title: string;
  metaDescription: string;
  headline: string;
  buyerGuideSummary: string;
  careAdvice: string;
  faqs: FaqItem[];
}

export interface ProgrammaticEvaluationResult {
  slug: string;
  isIndexable: boolean;
  robotsDirective: "index, follow" | "noindex, follow";
  canonicalUrl: string;
  matchingProductCount: number;
  definition: ProgrammaticPageDefinition;
}

export const PROGRAMMATIC_COLLECTIONS: ProgrammaticPageDefinition[] = [
  {
    slug: "boucle-sofas",
    categoryHandle: "sofas",
    materialFilter: "boucle",
    title: "Luxury Bouclé Sofas UK | Handcrafted 3-Seaters & Chaises",
    metaDescription: "Discover handcrafted British bouclé sofas. Textured tactile upholstery, FSC solid oak frames, and free 2-man white glove delivery on orders over £500.",
    headline: "Architectural Bouclé Sofas",
    buyerGuideSummary: "Tactile, warm, and endlessly inviting, our bouclé collection balances sculptural curved silhouettes with heavy-duty looped wool-blend fabrics engineered for modern British homes.",
    careAdvice: "Vacuum weekly with a soft brush attachment. Gently dab water spills immediately with an undyed absorbent cloth; do not rub loop fibres.",
    faqs: [
      {
        question: "Is bouclé durable for everyday family living?",
        answer: "Yes, our UK bouclé fabric achieves over 40,000 Martindale rubs, making it exceptionally resilient to daily use while maintaining its soft textured pile.",
      },
      {
        question: "Are SAN Furniture bouclé sofas compliant with UK fire safety?",
        answer: "Every upholstered sofa strictly conforms to the UK Furniture and Furnishings (Fire Safety) Regulations 1988 under standard BS 5852.",
      },
      {
        question: "How does 2-man white glove delivery work for sofas?",
        answer: "Our specialized logistics team delivers the piece directly into your room of choice, unpacks it, inspects it with you, and takes away all recyclable packaging.",
      },
    ],
  },
  {
    slug: "velvet-accent-armchairs",
    categoryHandle: "armchairs",
    materialFilter: "velvet",
    title: "Plush Velvet Accent Chairs & Reading Chairs | SAN Furniture",
    metaDescription: "Make an architectural statement with our short-pile luxury velvet armchairs. High-density foam seating, brushed brass details, and rapid UK delivery.",
    headline: "Sculptural Velvet Armchairs",
    buyerGuideSummary: "Crafted to become the focal point of living rooms, bedrooms, and studies, our velvet occasional seating combines deep jewel tones with ergonomic British posture support.",
    careAdvice: "Brush with a velvet brush in the direction of the pile. Avoid direct prolonged UV exposure to prevent pigment fading.",
    faqs: [
      {
        question: "Do velvet armchairs crush easily?",
        answer: "Our commercial-grade velvet features a dense backing that resists pressure marks. Any minor crushing can be effortlessly smoothed with light steaming.",
      },
      {
        question: "Can I order free velvet fabric swatches?",
        answer: "Yes, we dispatch complimentary fabric swatch packs across the UK so you can inspect textures under your home's natural lighting.",
      },
    ],
  },
  {
    slug: "solid-oak-dining-tables",
    categoryHandle: "dining",
    materialFilter: "none",
    title: "Solid European Oak Dining Tables | SAN Furniture UK",
    metaDescription: "Architectural solid oak dining tables, handcrafted with heat-resistant matte oil finishes. Designed for intimate British family gatherings.",
    headline: "Handcrafted Solid Oak Dining Collections",
    buyerGuideSummary: "Sourced from sustainably managed European forests, our solid oak dining suites showcase distinctive natural grain patterns, bevelled edges, and robust pedestal supports.",
    careAdvice: "Wipe with a damp microfibre cloth. Use coasters for hot mugs and dishes to protect the natural protective oil coat.",
    faqs: [
      {
        question: "How do I maintain natural solid oak?",
        answer: "Our oak tables are pre-treated with protective hard-wax oil. We recommend reapplying nourishing wood oil once a year to preserve moisture.",
      },
    ],
  },
];

export class ProgrammaticSeoEngine {
  private baseUrl: string;
  private minProductsThreshold: number;

  constructor(baseUrl = "https://sanfurniture.co.uk", minProductsThreshold = 1) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.minProductsThreshold = minProductsThreshold;
  }

  /**
   * Evaluate a programmatic landing page against the Thin Content Guard
   */
  public evaluateCollection(
    def: ProgrammaticPageDefinition,
    availableProducts: Array<{ categoryId: string; specs: { material: string } }>
  ): ProgrammaticEvaluationResult {
    // Count active products matching this programmatic filter
    const matchingCount = availableProducts.filter((p) => {
      const matchCat = p.categoryId.includes(def.categoryHandle);
      const matchMat = def.materialFilter ? p.specs.material === def.materialFilter : true;
      return matchCat && matchMat;
    }).length;

    // Thin Content Guard check
    const isIndexable = matchingCount >= this.minProductsThreshold;

    const canonicalUrl = isIndexable
      ? `${this.baseUrl}/collections/${def.slug}`
      : `${this.baseUrl}/categories/${def.categoryHandle}`; // Fallback canonical to avoid duplicate thin page penalty

    return {
      slug: def.slug,
      isIndexable,
      robotsDirective: isIndexable ? "index, follow" : "noindex, follow",
      canonicalUrl,
      matchingProductCount: matchingCount,
      definition: def,
    };
  }

  public getCollectionBySlug(slug: string): ProgrammaticPageDefinition | undefined {
    return PROGRAMMATIC_COLLECTIONS.find((c) => c.slug === slug);
  }
}
