import { model } from "@medusajs/framework/utils";
export const FurnitureSpec = model.define("furniture_spec", {
    id: model.id().primaryKey(),
    product_id: model.text().unique(),
    width_cm: model.float(),
    height_cm: model.float(),
    depth_cm: model.float(),
    seat_height_cm: model.float().nullable(),
    weight_kg: model.float(),
    material: model.text(),
    frame_material: model.text(),
    color: model.text(),
    assembly_required: model.boolean().default(false),
    delivery_tier: model.text().default("two_man_white_glove"),
    fire_safety_compliant: model.boolean().default(true),
    fire_safety_standard: model.text().default("BS 5852: Part 1: 1979 (Cigarette & Match Test)"),
    fire_safety_certificate: model.text(),
    lead_time_days: model.number().default(5)
});
export default FurnitureSpec;
