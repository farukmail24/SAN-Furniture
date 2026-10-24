import test from "node:test";
import assert from "node:assert/strict";

import { SchemaOrgGenerator } from "../dist/src/modules/seo/services/schema-org-generator.js";
import {
  ProgrammaticSeoEngine,
  PROGRAMMATIC_COLLECTIONS,
} from "../dist/src/modules/seo/services/programmatic-seo-engine.js";

test("SchemaOrgGenerator: Emits valid Schema.org Organization, Breadcrumbs and FAQ JSON-LD", () => {
  const generator = new SchemaOrgGenerator("https://sanfurniture.com");

  // Organization Schema
  const org = generator.generateOrganizationSchema();
  assert.equal(org["@type"], "FurnitureStore");
  assert.equal(org.name, "SAN Furniture");
  assert.equal(org.currenciesAccepted, "GBP");
  assert.equal(org.address.addressCountry, "GB");

  // Breadcrumbs Schema
  const breadcrumbs = generator.generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Collections", url: "/catalog" },
    { name: "Sofas", url: "/categories/sofas" },
  ]);
  assert.equal(breadcrumbs["@type"], "BreadcrumbList");
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(breadcrumbs.itemListElement[0].position, 1);
  assert.equal(breadcrumbs.itemListElement[0].name, "Home");
  assert.equal(breadcrumbs.itemListElement[2].item, "https://sanfurniture.com/categories/sofas");

  // FAQ Schema
  const faqs = generator.generateFaqSchema([
    {
      question: "Are your sofas BS 5852 fire safety certified?",
      answer: "Yes, 100% of upholstered seating satisfies UK regulations.",
    },
  ]);
  assert.equal(faqs["@type"], "FAQPage");
  assert.equal(faqs.mainEntity.length, 1);
  assert.equal(faqs.mainEntity[0].name, "Are your sofas BS 5852 fire safety certified?");
});

test("ProgrammaticSeoEngine: Thin Content Guard protects against Scaled Content Abuse penalties", () => {
  const engine = new ProgrammaticSeoEngine("https://sanfurniture.com", 2); // Requires at least 2 products

  const def = PROGRAMMATIC_COLLECTIONS[0]; // boucle-sofas

  // Scenario A: Plentiful inventory (3 matching boucle sofas)
  const healthyInventory = [
    { categoryId: "cat_sofas", specs: { material: "boucle" } },
    { categoryId: "cat_sofas", specs: { material: "boucle" } },
    { categoryId: "cat_sofas", specs: { material: "boucle" } },
  ];

  const healthyResult = engine.evaluateCollection(def, healthyInventory);
  assert.equal(healthyResult.isIndexable, true);
  assert.equal(healthyResult.robotsDirective, "index, follow");
  assert.equal(healthyResult.canonicalUrl, "https://sanfurniture.com/collections/boucle-sofas");
  assert.equal(healthyResult.matchingProductCount, 3);

  // Scenario B: Thin / Depleted inventory (only 1 product remains)
  const thinInventory = [
    { categoryId: "cat_sofas", specs: { material: "boucle" } },
    { categoryId: "cat_dining", specs: { material: "oak" } },
  ];

  const thinResult = engine.evaluateCollection(def, thinInventory);
  // Thin Content Guard triggers: Do not index thin page, canonicalize to parent category
  assert.equal(thinResult.isIndexable, false);
  assert.equal(thinResult.robotsDirective, "noindex, follow");
  assert.equal(thinResult.canonicalUrl, "https://sanfurniture.com/categories/sofas");
  assert.equal(thinResult.matchingProductCount, 1);
});
