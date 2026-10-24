import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    const [rows]: any = await pool.query(
      `
      SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
             s.material, s.color, s.assembly_required, s.fire_safety_compliant, s.delivery_tier,
             COALESCE(sup.cost_price_pennies, 0) as cost_price_pennies,
             COALESCE(sup.markup_percentage, 40) as markup_percentage,
             COALESCE(sup.stock_level, 25) as stock_level,
             COALESCE(sup.shipping_cost_pennies, 4900) as shipping_cost_pennies,
             COALESCE(sup.lead_time_days, 5) as lead_time_days
      FROM products p
      LEFT JOIN furniture_specs s ON p.id = s.product_id
      LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id
      WHERE p.id = ? OR p.handle = ?
      LIMIT 1
    `,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const prod = rows[0];
    prod.images = prod.images_json
      ? typeof prod.images_json === "string"
        ? JSON.parse(prod.images_json)
        : prod.images_json
      : [prod.thumbnail_url];
    prod.variants = prod.variants_json
      ? typeof prod.variants_json === "string"
        ? JSON.parse(prod.variants_json)
        : prod.variants_json
      : [];

    return NextResponse.json({ success: true, product: prod });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch product", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const {
      title,
      pricePennies,
      compareAtPricePennies,
      categoryId,
      thumbnailUrl,
      images,
      imagesJson,
      variants,
      variantsJson,
      supplierCostPennies,
      widthCm,
      heightCm,
      depthCm,
      weightKg,
      material,
      color,
      deliveryType,
      fireSafetyCompliant,
    } = body;

    const pFields: string[] = [];
    const pParams: any[] = [];
    if (title !== undefined) {
      pFields.push("title = ?");
      pParams.push(title);
    }
    if (pricePennies !== undefined) {
      pFields.push("price_pennies = ?");
      pParams.push(pricePennies);
    }
    if (compareAtPricePennies !== undefined) {
      pFields.push("compare_at_price_pennies = ?");
      pParams.push(compareAtPricePennies);
    }
    if (categoryId !== undefined) {
      pFields.push("category_id = ?");
      pParams.push(categoryId);
    }
    if (thumbnailUrl !== undefined) {
      pFields.push("thumbnail_url = ?");
      pParams.push(thumbnailUrl);
    }
    if (images !== undefined || imagesJson !== undefined) {
      const imgs = Array.isArray(images)
        ? images
        : typeof imagesJson === "string"
        ? JSON.parse(imagesJson)
        : imagesJson || [];
      pFields.push("images_json = ?");
      pParams.push(JSON.stringify(imgs));
    }
    if (variants !== undefined || variantsJson !== undefined) {
      const v = Array.isArray(variants)
        ? variants
        : typeof variantsJson === "string"
        ? JSON.parse(variantsJson)
        : variantsJson || [];
      pFields.push("variants_json = ?");
      pParams.push(JSON.stringify(v));
    }

    if (pFields.length > 0) {
      pParams.push(id);
      await pool.query(`UPDATE products SET ${pFields.join(", ")} WHERE id = ?`, pParams);
    }

    // Update specs if provided
    const sFields: string[] = [];
    const sParams: any[] = [];
    if (widthCm !== undefined) {
      sFields.push("width_cm = ?");
      sParams.push(widthCm);
    }
    if (heightCm !== undefined) {
      sFields.push("height_cm = ?");
      sParams.push(heightCm);
    }
    if (depthCm !== undefined) {
      sFields.push("depth_cm = ?");
      sParams.push(depthCm);
    }
    if (weightKg !== undefined) {
      sFields.push("weight_kg = ?");
      sParams.push(weightKg);
    }
    if (material !== undefined) {
      sFields.push("material = ?");
      sParams.push(material);
    }
    if (color !== undefined) {
      sFields.push("color = ?");
      sParams.push(color);
    }
    if (deliveryType !== undefined) {
      sFields.push("delivery_tier = ?");
      sParams.push(deliveryType);
    }
    if (fireSafetyCompliant !== undefined) {
      sFields.push("fire_safety_compliant = ?");
      sParams.push(fireSafetyCompliant ? 1 : 0);
    }

    if (sFields.length > 0) {
      sParams.push(id);
      await pool.query(`UPDATE furniture_specs SET ${sFields.join(", ")} WHERE product_id = ?`, sParams);
    }

    if (supplierCostPennies !== undefined) {
      await pool.query(
        "UPDATE supplier_feed_items SET cost_price_pennies = ? WHERE product_id = ?",
        [supplierCostPennies, id]
      );
    }

    return NextResponse.json({ success: true, message: `Product ${id} updated successfully` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update product", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    await pool.query("DELETE FROM furniture_specs WHERE product_id = ?", [id]);
    await pool.query("DELETE FROM supplier_feed_items WHERE product_id = ?", [id]);
    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    try {
      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [
          `log_${Date.now()}`,
          "admin@sanfurniture.com",
          "DELETE_PRODUCT",
          "products",
          JSON.stringify({ id }),
          "127.0.0.1",
        ]
      );
    } catch {}

    return NextResponse.json({ success: true, message: `Product ${id} removed` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete product", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
