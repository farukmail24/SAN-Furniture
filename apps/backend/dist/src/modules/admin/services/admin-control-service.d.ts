import { type DeliveryTier, type UKPostcodeZone } from "@san-furniture/types";
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
export declare class AdminControlService {
    private ipJailService;
    private auditLogs;
    private redirectRules;
    private logisticsConfig;
    private marginRules;
    constructor(ipJailService?: IpJailService);
    /**
     * Log an immutable admin operation
     */
    logAudit(adminId: string, action: string, resource: string, details: string): AuditLogEntry;
    getAuditLogs(): AuditLogEntry[];
    /**
     * Calculate live sales & margin analytics
     */
    getSalesAnalytics(orders: Array<{
        amountPennies: number;
        supplierCostPennies: number;
    }>): SalesAnalyticsSummary;
    /**
     * Get and update logistics matrix
     */
    getLogisticsConfig(): LogisticsConfig;
    updateLogisticsConfig(adminId: string, updates: Partial<LogisticsConfig>): LogisticsConfig;
    /**
     * Get and update supplier margin rules
     */
    getMarginRules(): SupplierMarginRule[];
    updateMarginRule(adminId: string, categoryId: string, targetMargin: number, floorMargin: number): SupplierMarginRule | null;
    /**
     * Security & IP Jail operations
     */
    listJailedIps(): IpJailRecord[];
    unblockIp(adminId: string, ip: string): boolean;
    /**
     * 301 Redirect management
     */
    listRedirects(): RedirectRule[];
    addRedirect(adminId: string, sourcePath: string, destinationPath: string): RedirectRule;
}
