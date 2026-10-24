export class SchemaOrgGenerator {
    baseUrl;
    constructor(baseUrl = "https://sanfurniture.com") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    /**
     * Organization Schema with UK Legal & Contact Details
     */
    generateOrganizationSchema() {
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
    generateBreadcrumbSchema(breadcrumbs) {
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
    generateFaqSchema(faqs) {
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
