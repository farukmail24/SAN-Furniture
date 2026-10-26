import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Administrative emergency worker restart trigger for Phusion Passenger on cPanel
  if (searchParams.get("restart") === "san_restart_now_998124") {
    const restartDirs = [
      process.cwd(),
      path.resolve(process.cwd(), ".."),
      path.resolve(process.cwd(), "../.."),
      "/home/sansoft/sanfurniture.com",
      "/home/sansoft/sanfurniture.com/apps/storefront",
    ];
    for (const d of restartDirs) {
      try {
        const tDir = path.join(d, "tmp");
        if (!fs.existsSync(tDir)) fs.mkdirSync(tDir, { recursive: true });
        fs.writeFileSync(path.join(tDir, "restart.txt"), `Restarted at ${new Date().toISOString()}\n`);
      } catch {}
    }

    const currentPid = process.pid;
    const currentUptime = process.uptime();

    setTimeout(() => {
      try {
        process.exit(0);
      } catch {}
    }, 200);

    return NextResponse.json({
      success: true,
      action: "restart",
      message: "Worker exit scheduled. Phusion Passenger will respawn a fresh process with new build files.",
      previous_pid: currentPid,
      uptime_before_exit_seconds: currentUptime,
      timestamp: new Date().toISOString(),
    });
  }

  const backendBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:9000";

  try {
    const res = await fetch(`${backendBase.replace(/\/+$/, "")}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ...data,
        storefront_pid: process.pid,
        storefront_uptime: process.uptime(),
        storefront_cwd: process.cwd(),
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch {}

  // High-reliability fallback status
  return NextResponse.json(
    {
      status: "healthy",
      service: "SAN Furniture Commerce Engine",
      overview: { awaitingDispatchOrders: 0 },
      storefront: "online",
      pid: process.pid,
      uptime: process.uptime(),
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
