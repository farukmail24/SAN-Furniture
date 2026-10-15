import { formatGBP, calculateNetAndVat, type DeliveryTier, type UKPostcodeZone } from "@san-furniture/types";
import { IpJailService, type IpJailRecord } from "../../security/services/ip-jail-service.js";

export interface SalesAnalyticsSummary {
  grossSalesPennies: number;
  formattedGrossSales: string;
  supplierCostPennies: number;
  formattedSupplierCost: string;
  grossProfitPennies: number;
  formattedGrossProfit: string;
  profitMarginPercent: number;
  totalOrdersCount: number;
  averageOrderValuePennies: number;
  formattedAov: string;
}

export interface LogisticsConfig {
  freeDeliveryThresholdPennies: number;
  baseDeliveryRates: Record<DeliveryTier, number>;
  regionalSurcharges: Record<UKPostcodeZone, number>;
}

export interface SupplierMarginRule {
  categoryId: string;
  categoryName: string;
  targetMarginPercent: number;
  minimumFloorMarginPercent: number;
  supplierId: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: 301 | 302;
  createdAt: string;
}

export class AdminControlService {
  private ipJailService: IpJailService;
  private auditLogs: AuditLogEntry[] = [];
  private redirectRules: RedirectRule[] = [];

  private logisticsConfig: LogisticsConfig = {
    freeDeliveryThresholdPennies: 50000, // £500.00
    baseDeliveryRates: {
      standard_parcel: 999,   // £9.99
      pallet: 3900,           // £39.00
      two_man_white_glove: 4900, // £49.00
    },
    regionalSurcharges: {
      zone_1_mainland: 0,
      zone_2_scottish_highlands: 4900, // £49.00
      zone_3_scottish_islands: 6900,   // £69.00
      zone_4_northern_ireland: 5900,   // £59.00
      zone_5_uk_offshore: 6500,        // £65.00
      zone_excluded: 0,
    },
  };

  private marginRules: SupplierMarginRule[] = [
    {
      categoryId: "cat_sofas",
      categoryName: "Sofas & Lounges",
      targetMarginPercent: 35.0,
      minimumFloorMarginPercent: 15.0,
      supplierId: "uk_craft_sofas",
    },
    {
      categoryId: "cat_armchairs",
      categoryName: "Accent Armchairs",
      targetMarginPercent: 32.0,
      minimumFloorMarginPercent: 15.0,
      supplierId: "uk_craft_sofas",
    },
    {
      categoryId: "cat_dining",
      categoryName: "Dining Collections",
      targetMarginPercent: 38.0,
      minimumFloorMarginPercent: 18.0,
      supplierId: "cotswold_timber_works",
    },
  ];

  constructor(ipJailService?: IpJailService) {
    this.ipJailService = ipJailService ?? new IpJailService();

    // Default seed redirect rule for migrated catalog
    this.redirectRules.push({
      id: "redir_1",
      sourcePath: "/old-sofas/kensington",
      destinationPath: "/products/kensington-3-seater-sofa-oat-boucle",
      statusCode: 301,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Log an immutable admin operation
   */
  public logAudit(adminId: string, action: string, resource: string, details: string): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Calculate live sales & margin analytics
   */
  public getSalesAnalytics(
    orders: Array<{ amountPennies: number; supplierCostPennies: number }>
  ): SalesAnalyticsSummary {
    const totalOrdersCount = orders.length;
    if (totalOrdersCount === 0) {
      return {
        grossSalesPennies: 0,
        formattedGrossSales: "£0.00",
        supplierCostPennies: 0,
        formattedSupplierCost: "£0.00",
        grossProfitPennies: 0,
        formattedGrossProfit: "£0.00",
        profitMarginPercent: 0,
        totalOrdersCount: 0,
        averageOrderValuePennies: 0,
        formattedAov: "£0.00",
      };
    }

    const grossSalesPennies = orders.reduce((sum, o) => sum + o.amountPennies, 0);
    const supplierCostPennies = orders.reduce((sum, o) => sum + o.supplierCostPennies, 0);
    const grossProfitPennies = grossSalesPennies - supplierCostPennies;
    const profitMarginPercent = Number(((grossProfitPennies / grossSalesPennies) * 100).toFixed(1));
    const averageOrderValuePennies = Math.round(grossSalesPennies / totalOrdersCount);

    return {
      grossSalesPennies,
      formattedGrossSales: formatGBP(grossSalesPennies),
      supplierCostPennies,
      formattedSupplierCost: formatGBP(supplierCostPennies),
      grossProfitPennies,
      formattedGrossProfit: formatGBP(grossProfitPennies),
      profitMarginPercent,
      totalOrdersCount,
      averageOrderValuePennies,
      formattedAov: formatGBP(averageOrderValuePennies),
    };
  }

  /**
   * Get and update logistics matrix
   */
  public getLogisticsConfig(): LogisticsConfig {
    return { ...this.logisticsConfig };
  }

  public updateLogisticsConfig(adminId: string, updates: Partial<LogisticsConfig>): LogisticsConfig {
    if (updates.freeDeliveryThresholdPennies !== undefined) {
      this.logisticsConfig.freeDeliveryThresholdPennies = updates.freeDeliveryThresholdPennies;
    }
    if (updates.baseDeliveryRates) {
      this.logisticsConfig.baseDeliveryRates = {
        ...this.logisticsConfig.baseDeliveryRates,
        ...updates.baseDeliveryRates,
      };
    }
    if (updates.regionalSurcharges) {
      this.logisticsConfig.regionalSurcharges = {
        ...this.logisticsConfig.regionalSurcharges,
        ...updates.regionalSurcharges,
      };
    }

    this.logAudit(
      adminId,
      "UPDATE_LOGISTICS_CONFIG",
      "logistics",
      `Updated free delivery threshold to ${formatGBP(this.logisticsConfig.freeDeliveryThresholdPennies)}`
    );

    return this.getLogisticsConfig();
  }

  /**
   * Get and update supplier margin rules
   */
  public getMarginRules(): SupplierMarginRule[] {
    return [...this.marginRules];
  }

  public updateMarginRule(
    adminId: string,
    categoryId: string,
    targetMargin: number,
    floorMargin: number
  ): SupplierMarginRule | null {
    const rule = this.marginRules.find((r) => r.categoryId === categoryId);
    if (!rule) return null;

    rule.targetMarginPercent = targetMargin;
    rule.minimumFloorMarginPercent = floorMargin;

    this.logAudit(
      adminId,
      "UPDATE_MARGIN_RULE",
      `category:${categoryId}`,
      `Set target margin: ${targetMargin}%, floor margin: ${floorMargin}%`
    );

    return { ...rule };
  }

  /**
   * Security & IP Jail operations
   */
  public listJailedIps(): IpJailRecord[] {
    return this.ipJailService.listActiveJailRecords();
  }

  public unblockIp(adminId: string, ip: string): boolean {
    const success = this.ipJailService.releaseIp(ip, true);
    if (success) {
      this.logAudit(adminId, "UNBLOCK_IP", `ip:${ip}`, `Pardoned and removed IP ${ip} from jail`);
    }
    return success;
  }

  /**
   * 301 Redirect management
   */
  public listRedirects(): RedirectRule[] {
    return [...this.redirectRules];
  }

  public addRedirect(adminId: string, sourcePath: string, destinationPath: string): RedirectRule {
    const rule: RedirectRule = {
      id: `redir_${Date.now()}`,
      sourcePath,
      destinationPath,
      statusCode: 301,
      createdAt: new Date().toISOString(),
    };
    this.redirectRules.push(rule);
    this.logAudit(adminId, "ADD_REDIRECT", `redirect:${rule.id}`, `301 ${sourcePath} -> ${destinationPath}`);
    return rule;
  }
}
