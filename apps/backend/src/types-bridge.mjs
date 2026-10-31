import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  path.resolve(currentDir, "../../../packages/types/dist/index.js"),
  path.resolve(currentDir, "../../packages/types/dist/index.js"),
  path.resolve(process.cwd(), "packages/types/dist/index.js"),
  path.resolve(process.cwd(), "../packages/types/dist/index.js"),
  path.resolve(process.cwd(), "../../packages/types/dist/index.js"),
];

const found = candidates.find((p) => fs.existsSync(p));
if (!found) {
  throw new Error(`[SAN Types Bridge] Could not locate packages/types/dist/index.js in: ${candidates.join(", ")}`);
}

const typesModule = await import(pathToFileURL(found).href);

export const {
  formatGBP,
  calculateNetAndVat,
  classifyUKPostcode,
  calculateRetailWithMarginGuard,
  MarginAlertSchema,
  SupplierFeedItemSchema,
  CustomerRegistrationSchema,
  FurnitureSpecsSchema,
  UK_MAINLAND_REGIONS,
  UK_POSTCODE_AREA_DATA,
  extractUKPostcodeArea,
  isMainlandUKPostcode,
  resolveUKPostcodeInfo,
  CATALOG_CATEGORIES,
  CATEGORY_HANDLE_ALIASES,
  normalizeCategoryHandle,
  PRODUCT_HANDLE_ALIASES,
  normalizeProductHandle,
  getCategoryByHandle,
  FURNITURE_SUBTYPES,
  getCategorySubTypes,
  resolveSubType,
  productMatchesSubType,
  getSubTypesWithCounts,
} = typesModule;

export default typesModule;
