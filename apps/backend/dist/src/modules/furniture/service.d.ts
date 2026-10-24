declare const FurnitureModuleService_base: import("@medusajs/framework/utils").MedusaServiceReturnType<import("@medusajs/framework/utils").ModelConfigurationsToConfigTemplate<{
    readonly FurnitureSpec: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
        id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").IdProperty>;
        product_id: import("@medusajs/framework/utils").TextProperty;
        width_cm: import("@medusajs/framework/utils").FloatProperty;
        height_cm: import("@medusajs/framework/utils").FloatProperty;
        depth_cm: import("@medusajs/framework/utils").FloatProperty;
        seat_height_cm: import("@medusajs/framework/utils").NullableModifier<number, import("@medusajs/framework/utils").FloatProperty>;
        weight_kg: import("@medusajs/framework/utils").FloatProperty;
        material: import("@medusajs/framework/utils").TextProperty;
        frame_material: import("@medusajs/framework/utils").TextProperty;
        color: import("@medusajs/framework/utils").TextProperty;
        assembly_required: import("@medusajs/framework/utils").BooleanProperty;
        delivery_tier: import("@medusajs/framework/utils").TextProperty;
        fire_safety_compliant: import("@medusajs/framework/utils").BooleanProperty;
        fire_safety_standard: import("@medusajs/framework/utils").TextProperty;
        fire_safety_certificate: import("@medusajs/framework/utils").TextProperty;
        lead_time_days: import("@medusajs/framework/utils").NumberProperty;
    }>, "furniture_spec">;
}>>;
export declare class FurnitureModuleService extends FurnitureModuleService_base {
    /**
     * Helper to retrieve full furniture specifications by internal product ID
     */
    getSpecByProductId(productId: string): Promise<{
        id: string;
        product_id: string;
        width_cm: number;
        height_cm: number;
        depth_cm: number;
        seat_height_cm: number | null;
        weight_kg: number;
        material: string;
        frame_material: string;
        color: string;
        assembly_required: boolean;
        delivery_tier: string;
        fire_safety_compliant: boolean;
        fire_safety_standard: string;
        fire_safety_certificate: string;
        lead_time_days: number;
        raw_seat_height_cm: Record<string, unknown> | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
export default FurnitureModuleService;
