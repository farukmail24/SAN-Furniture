export declare const FurnitureSpec: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
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
export default FurnitureSpec;
