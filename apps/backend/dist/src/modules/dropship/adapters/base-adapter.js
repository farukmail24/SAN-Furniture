import { SupplierFeedItemSchema } from "@san-furniture/types";
export class BaseSupplierAdapter {
    supplierId;
    supplierName;
    constructor(supplierId, supplierName) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
    }
    getSupplierId() {
        return this.supplierId;
    }
    getSupplierName() {
        return this.supplierName;
    }
    /**
     * Validate and sanitize a normalized item against Zod schema
     */
    validateItem(rawItem, rowNumber) {
        const parseResult = SupplierFeedItemSchema.safeParse(rawItem);
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0];
            const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
            return { error: `Row ${rowNumber}: ${message}` };
        }
        return { item: parseResult.data };
    }
}
