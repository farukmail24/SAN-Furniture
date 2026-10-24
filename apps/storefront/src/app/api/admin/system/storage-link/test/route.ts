import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const uploadsDir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const testFile = path.join(uploadsDir, ".test-write");
    fs.writeFileSync(testFile, "OK", "utf8");
    fs.unlinkSync(testFile);

    return NextResponse.json({
      success: true,
      message: "Self-test passed! Storage directory is fully writable.",
      httpAccessible: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
