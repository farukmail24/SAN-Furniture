export interface MySqlTuningConfig {
  innodbBufferPoolSize: string;
  innodbLogBufferSize: string;
  maxConnections: number;
}

export interface QueryIndexCompatibility {
  compatible: boolean;
  recommendedIndex: string;
  rationale: string;
}

export class QueryOptimizerService {
  public generateMySqlTuning(totalRamGb = 8): MySqlTuningConfig {
    const bufferPoolMb = Math.round(totalRamGb * 1024 * 0.7);

    return {
      innodbBufferPoolSize: `${bufferPoolMb}MB`,
      innodbLogBufferSize: "64MB",
      maxConnections: 100,
    };
  }

  public verifyQueryIndexCompatibility(querySql: string): QueryIndexCompatibility {
    const normalized = querySql.toLowerCase();

    if (
      normalized.includes("category_id") &&
      normalized.includes("status") &&
      normalized.includes("price_pennies")
    ) {
      return {
        compatible: true,
        recommendedIndex: "idx_prod_cat_status_price",
        rationale: "Matches the category_id, status, price_pennies composite index in the MySQL schema.",
      };
    }

    if (
      normalized.includes("supplier_id") &&
      normalized.includes("supplier_sku")
    ) {
      return {
        compatible: true,
        recommendedIndex: "uniq_supplier_sku",
        rationale: "Matches the supplier_id, supplier_sku unique index in the MySQL schema.",
      };
    }

    if (normalized.includes("like") || normalized.includes("%")) {
      return {
        compatible: true,
        recommendedIndex: "Meilisearch",
        rationale: "Use Meilisearch for typo-tolerant/fuzzy catalog search rather than relying on a database-specific trigram index.",
      };
    }

    if (normalized.includes("status")) {
      return {
        compatible: false,
        recommendedIndex: "idx_products_status",
        rationale: "The current MySQL schema has no status-leading index for this query pattern.",
      };
    }

    return {
      compatible: true,
      recommendedIndex: "PRIMARY",
      rationale: "Use the primary key for direct record lookups.",
    };
  }
}
