import { MedusaService } from "@medusajs/framework/utils";
import { FurnitureSpec } from "./models/furniture-spec.js";
export class FurnitureModuleService extends MedusaService({
    FurnitureSpec,
}) {
    /**
     * Helper to retrieve full furniture specifications by internal product ID
     */
    async getSpecByProductId(productId) {
        const specs = await this.listFurnitureSpecs({
            product_id: productId,
        });
        return specs[0] || null;
    }
}
export default FurnitureModuleService;
