import { formatGBP } from "@san-furniture/types";
import { IpJailService } from "../../security/services/ip-jail-service.js";
export class AdminControlService {
    ipJailService;
    auditLogs = [];
    redirectRules = [];
    logisticsConfig = {
        freeDeliveryThresholdPennies: 50000, // £500.00
        baseDeliveryRates: {
            standard_parcel: 999, // £9.99
            pallet: 3900, // £39.00
            two_man_white_glove: 4900, // £49.00
        },
        regionalSurcharges: {
            zone_1_mainland: 0,
            zone_2_scottish_highlands: 4900, // £49.00
            zone_3_scottish_islands: 6900, // £69.00
            zone_4_northern_ireland: 5900, // £59.00
            zone_5_uk_offshore: 6500, // £65.00
            zone_excluded: 0,
        },
    };
    marginRules = [
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
    constructor(ipJailService) {
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
    logAudit(adminId, action, resource, details) {
        const entry = {
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
    getAuditLogs() {
        return [...this.auditLogs];
    }
    /**
     * Calculate live sales & margin analytics
     */
    getSalesAnalytics(orders) {
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
    getLogisticsConfig() {
        return { ...this.logisticsConfig };
    }
    updateLogisticsConfig(adminId, updates) {
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
        this.logAudit(adminId, "UPDATE_LOGISTICS_CONFIG", "logistics", `Updated free delivery threshold to ${formatGBP(this.logisticsConfig.freeDeliveryThresholdPennies)}`);
        return this.getLogisticsConfig();
    }
    /**
     * Get and update supplier margin rules
     */
    getMarginRules() {
        return [...this.marginRules];
    }
    updateMarginRule(adminId, categoryId, targetMargin, floorMargin) {
        const rule = this.marginRules.find((r) => r.categoryId === categoryId);
        if (!rule)
            return null;
        rule.targetMarginPercent = targetMargin;
        rule.minimumFloorMarginPercent = floorMargin;
        this.logAudit(adminId, "UPDATE_MARGIN_RULE", `category:${categoryId}`, `Set target margin: ${targetMargin}%, floor margin: ${floorMargin}%`);
        return { ...rule };
    }
    /**
     * Security & IP Jail operations
     */
    listJailedIps() {
        return this.ipJailService.listActiveJailRecords();
    }
    unblockIp(adminId, ip) {
        const success = this.ipJailService.releaseIp(ip, true);
        if (success) {
            this.logAudit(adminId, "UNBLOCK_IP", `ip:${ip}`, `Pardoned and removed IP ${ip} from jail`);
        }
        return success;
    }
    /**
     * 301 Redirect management
     */
    listRedirects() {
        return [...this.redirectRules];
    }
    addRedirect(adminId, sourcePath, destinationPath) {
        const rule = {
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
