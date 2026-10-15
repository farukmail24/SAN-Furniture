import { type SupplierFeedItem, SupplierFeedItemSchema } from "@san-furniture/types";

export interface FeedParseResult {
  supplierId: string;
  items: SupplierFeedItem[];
  invalidItemsCount: number;
  errors: { row: number; reason: string }[];
  parsedAt: string;
}

export abstract class BaseSupplierAdapter {
  protected supplierId: string;
  protected supplierName: string;

  constructor(supplierId: string, supplierName: string) {
    this.supplierId = supplierId;
    this.supplierName = supplierName;
  }

  public getSupplierId(): string {
    return this.supplierId;
  }

  public getSupplierName(): string {
    return this.supplierName;
  }

  /**
   * Parse raw feed string or buffer into standardized SupplierFeedItem array
   */
  public abstract parse(rawContent: string): Promise<FeedParseResult>;

  /**
   * Validate and sanitize a normalized item against Zod schema
   */
  protected validateItem(rawItem: unknown, rowNumber: number): { item?: SupplierFeedItem; error?: string } {
    const parseResult = SupplierFeedItemSchema.safeParse(rawItem);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed";
      return { error: `Row ${rowNumber}: ${message}` };
    }
    return { item: parseResult.data };
  }
}
