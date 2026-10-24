import { BaseSupplierAdapter } from "./base-adapter.js";
export class CsvSupplierAdapter extends BaseSupplierAdapter {
    mapping;
    delimiter;
    constructor(supplierId, supplierName, mapping, delimiter = ",") {
        super(supplierId, supplierName);
        this.mapping = mapping;
        this.delimiter = delimiter;
    }
    async parse(rawContent) {
        const lines = rawContent
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        if (lines.length < 2) {
            return {
                supplierId: this.supplierId,
                items: [],
                invalidItemsCount: 0,
                errors: [{ row: 0, reason: "CSV content has insufficient rows" }],
                parsedAt: new Date().toISOString()
            };
        }
        const headerLine = lines[0];
        if (!headerLine) {
            throw new Error("Missing CSV header line");
        }
        const headers = this.parseCsvRow(headerLine, this.delimiter).map((h) => h.toLowerCase());
        const colIndex = {
            sku: headers.indexOf(this.mapping.sku.toLowerCase()),
            title: headers.indexOf(this.mapping.title.toLowerCase()),
            costPrice: headers.indexOf(this.mapping.costPrice.toLowerCase()),
            carriageCost: this.mapping.carriageCost ? headers.indexOf(this.mapping.carriageCost.toLowerCase()) : -1,
            stockLevel: headers.indexOf(this.mapping.stockLevel.toLowerCase()),
            leadTimeDays: this.mapping.leadTimeDays ? headers.indexOf(this.mapping.leadTimeDays.toLowerCase()) : -1,
            barcodeGtin: this.mapping.barcodeGtin ? headers.indexOf(this.mapping.barcodeGtin.toLowerCase()) : -1,
            categoryHint: this.mapping.categoryHint ? headers.indexOf(this.mapping.categoryHint.toLowerCase()) : -1,
            discontinued: this.mapping.discontinued ? headers.indexOf(this.mapping.discontinued.toLowerCase()) : -1
        };
        if (colIndex.sku === -1 || colIndex.title === -1 || colIndex.costPrice === -1 || colIndex.stockLevel === -1) {
            return {
                supplierId: this.supplierId,
                items: [],
                invalidItemsCount: 0,
                errors: [{ row: 0, reason: `Missing mandatory column mapping in CSV header` }],
                parsedAt: new Date().toISOString()
            };
        }
        const items = [];
        const errors = [];
        let invalidCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line)
                continue;
            const values = this.parseCsvRow(line, this.delimiter);
            try {
                const sku = values[colIndex.sku]?.trim();
                const title = values[colIndex.title]?.trim();
                const rawCost = values[colIndex.costPrice]?.trim() || "0";
                const rawStock = values[colIndex.stockLevel]?.trim() || "0";
                if (!sku || !title) {
                    invalidCount++;
                    errors.push({ row: i, reason: "Missing SKU or Title" });
                    continue;
                }
                const costPricePennies = this.parsePriceToPennies(rawCost);
                const carriageCostPennies = colIndex.carriageCost !== -1 && values[colIndex.carriageCost]
                    ? this.parsePriceToPennies(values[colIndex.carriageCost] ?? "0")
                    : 0;
                const stockLevel = Math.max(0, parseInt(rawStock, 10) || 0);
                const leadTimeDays = colIndex.leadTimeDays !== -1 && values[colIndex.leadTimeDays]
                    ? Math.max(1, parseInt(values[colIndex.leadTimeDays] ?? "3", 10) || 3)
                    : 3;
                const barcodeGtin = colIndex.barcodeGtin !== -1 ? values[colIndex.barcodeGtin]?.trim() : undefined;
                const categoryHint = colIndex.categoryHint !== -1 ? values[colIndex.categoryHint]?.trim() : undefined;
                const discontinued = colIndex.discontinued !== -1
                    ? /^(true|1|yes|y)$/i.test(values[colIndex.discontinued]?.trim() || "")
                    : false;
                const candidate = {
                    supplier_id: this.supplierId,
                    supplier_sku: sku,
                    product_title: title,
                    category_hint: categoryHint,
                    cost_price_pennies: costPricePennies,
                    carriage_cost_pennies: carriageCostPennies,
                    stock_level: stockLevel,
                    lead_time_days: leadTimeDays,
                    discontinued,
                    barcode_gtin: barcodeGtin,
                    supplier_updated_at: new Date().toISOString()
                };
                const validated = this.validateItem(candidate, i);
                if (validated.item) {
                    items.push(validated.item);
                }
                else if (validated.error) {
                    invalidCount++;
                    errors.push({ row: i, reason: validated.error });
                }
            }
            catch (err) {
                invalidCount++;
                const message = err instanceof Error ? err.message : "Parsing failure";
                errors.push({ row: i, reason: message });
            }
        }
        return {
            supplierId: this.supplierId,
            items,
            invalidItemsCount: invalidCount,
            errors,
            parsedAt: new Date().toISOString()
        };
    }
    /**
     * Helper to parse CSV values respecting quotes
     */
    parseCsvRow(row, delimiter) {
        const values = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === delimiter && !inQuotes) {
                values.push(current.trim());
                current = "";
            }
            else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    }
    /**
     * Parse string price ("£450.00", "450.00", "450") to integer pennies (45000)
     */
    parsePriceToPennies(raw) {
        const cleaned = raw.replace(/[£$,\s]/g, "");
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed) || parsed < 0) {
            throw new Error(`Invalid price format: ${raw}`);
        }
        return Math.round(parsed * 100);
    }
}
