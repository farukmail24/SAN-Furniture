export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export class SchemaOrgGenerator {
  private baseUrl: string;

  constructor(baseUrl = "https://sanfurniture.com") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Organization Schema with UK Legal & Contact Details
   */
  public generateOrganizationSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FurnitureStore",
      name: "SAN Furniture",
      url: this.baseUrl,
      logo: `${this.baseUrl}/images/brand-logo.png`,
      description: "Contemporary home furniture with direct Mainland UK delivery.",
      telephone: "+44 20 7946 0192",
      email: "support@sanfurniture.com",
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
      },
      currenciesAccepted: "GBP",
      paymentAccepted: "Credit Card, Debit Card",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
      ],
    };
  }

  /**
   * BreadcrumbList Schema for Google Search snippet hierarchies
   */
  public generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: crumb.name,
        item: crumb.url.startsWith("http") ? crumb.url : `${this.baseUrl}${crumb.url}`,
      })),
    };
  }

  /**
   * FAQPage Schema for SERP expandable rich snippets
   */
  public generateFaqSchema(faqs: FaqItem[]) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }
}
