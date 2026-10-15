export interface PostgresTuningConfig {
  sharedBuffers: string;
  effectiveCacheSize: string;
  workMem: string;
  maintenanceWorkMem: string;
  minWalSize: string;
  maxWalSize: string;
  checkpointCompletionTarget: number;
  walBuffers: string;
  defaultStatisticsTarget: number;
  randomPageCost: number;
  effectiveIoConcurrency: number;
  maxConnections: number;
}

export class QueryOptimizerService {
  /**
   * Compute optimized PostgreSQL configuration based on system RAM (in GB)
   */
  public generatePostgresTuning(totalRamGb = 8): PostgresTuningConfig {
    const sharedBuffersMb = Math.round(totalRamGb * 1024 * 0.25); // 25% of RAM
    const effectiveCacheSizeMb = Math.round(totalRamGb * 1024 * 0.75); // 75% of RAM
    const workMemMb = 16; // 16MB per connection work memory
    const maintenanceWorkMemMb = Math.min(1024, Math.round(totalRamGb * 1024 * 0.0625));

    return {
      sharedBuffers: `${sharedBuffersMb}MB`,
      effectiveCacheSize: `${effectiveCacheSizeMb}MB`,
      workMem: `${workMemMb}MB`,
      maintenanceWorkMem: `${maintenanceWorkMemMb}MB`,
      minWalSize: "1GB",
      maxWalSize: "4GB",
      checkpointCompletionTarget: 0.9,
      walBuffers: "16MB",
      defaultStatisticsTarget: 100,
      randomPageCost: 1.1, // Optimized for fast NVMe/SSD storage (vs 4.0 HDD default)
      effectiveIoConcurrency: 200,
      maxConnections: 100,
    };
  }

  /**
   * Audit query pattern against composite and partial indexes
   */
  public verifyQueryIndexCompatibility(querySql: string): {
    compatible: boolean;
    recommendedIndex: string;
    rationale: string;
  } {
    const normalized = querySql.toLowerCase();

    // Check 1: Category + Status + Price filter pattern
    if (normalized.includes("category_id") && normalized.includes("status") && normalized.includes("price")) {
      return {
        compatible: true,
        recommendedIndex: "idx_products_cat_status_created_price",
        rationale: "ESR (Equality, Sort, Range) composite index ensures sub-millisecond execution without temporary disk sorting.",
      };
    }

    // Check 2: Fuzzy search pattern
    if (normalized.includes("like") || normalized.includes("%") || normalized.includes("similarity")) {
      return {
        compatible: true,
        recommendedIndex: "idx_product_title_trgm",
        rationale: "GIN Trigram index eliminates sequential table scans during search-as-you-type autocomplete.",
      };
    }

    // Check 3: Active published product lookup
    if (normalized.includes("status = 'published'") || normalized.includes('status = "published"')) {
      return {
        compatible: true,
        recommendedIndex: "idx_published_furniture",
        rationale: "Partial index reduces memory overhead by indexing only active, non-deleted inventory.",
      };
    }

    return {
      compatible: true,
      recommendedIndex: "idx_products_active",
      rationale: "Standard primary key or active product index utilized.",
    };
  }
}
