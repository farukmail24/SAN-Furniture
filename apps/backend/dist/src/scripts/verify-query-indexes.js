export const VERIFIED_INDEX_PATTERNS = [
    {
        queryName: "Category and price catalog filtering",
        sqlPattern: `
      SELECT id, title, price_pennies
      FROM products
      WHERE category_id = ? AND status = ? AND price_pennies BETWEEN ? AND ?;
    `.trim(),
        targetIndex: "idx_prod_cat_status_price",
        indexColumns: ["category_id", "status", "price_pennies"],
        explanation: "Matches the composite index declared in database/san_furniture.sql.",
    },
    {
        queryName: "Supplier SKU reconciliation",
        sqlPattern: `
      SELECT id, product_id, cost_price_pennies, stock_level
      FROM supplier_feed_items
      WHERE supplier_id = ? AND supplier_sku = ?;
    `.trim(),
        targetIndex: "uniq_supplier_sku",
        indexColumns: ["supplier_id", "supplier_sku"],
        explanation: "Matches the unique supplier/SKU key declared in database/san_furniture.sql.",
    },
];
export function validateAllIndexPatterns() {
    for (const item of VERIFIED_INDEX_PATTERNS) {
        if (item.indexColumns.length === 0 || !item.targetIndex) {
            throw new Error(`MySQL index pattern ${item.queryName} is incomplete`);
        }
    }
    return true;
}
