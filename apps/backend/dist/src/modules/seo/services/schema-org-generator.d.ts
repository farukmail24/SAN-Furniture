export interface BreadcrumbItem {
    name: string;
    url: string;
}
export interface FaqItem {
    question: string;
    answer: string;
}
export declare class SchemaOrgGenerator {
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * Organization Schema with UK Legal & Contact Details
     */
    generateOrganizationSchema(): {
        "@context": string;
        "@type": string;
        name: string;
        url: string;
        logo: string;
        description: string;
        telephone: string;
        email: string;
        priceRange: string;
        address: {
            "@type": string;
            addressCountry: string;
        };
        currenciesAccepted: string;
        paymentAccepted: string;
        openingHoursSpecification: {
            "@type": string;
            dayOfWeek: string[];
            opens: string;
            closes: string;
        }[];
    };
    /**
     * BreadcrumbList Schema for Google Search snippet hierarchies
     */
    generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]): {
        "@context": string;
        "@type": string;
        itemListElement: {
            "@type": string;
            position: number;
            name: string;
            item: string;
        }[];
    };
    /**
     * FAQPage Schema for SERP expandable rich snippets
     */
    generateFaqSchema(faqs: FaqItem[]): {
        "@context": string;
        "@type": string;
        mainEntity: {
            "@type": string;
            name: string;
            acceptedAnswer: {
                "@type": string;
                text: string;
            };
        }[];
    };
}
