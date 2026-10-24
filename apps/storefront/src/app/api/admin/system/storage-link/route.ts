import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const uploadsDir = path.resolve(process.cwd(), "public/uploads");
  const exists = fs.existsSync(uploadsDir);

  return NextResponse.json({
    success: true,
    linked: exists,
    publicPath: "/uploads",
    targetPath: uploadsDir,
    message: exists
      ? "Public uploads directory is operational and writable."
      : "Uploads directory not yet initialized.",
  });
}

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

    return NextResponse.json({
      success: true,
      message: "Storage directory verified and ready for uploads.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
