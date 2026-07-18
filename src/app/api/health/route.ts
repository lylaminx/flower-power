import { NextResponse } from "next/server";
import { getDatabasePool } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getDatabasePool().query<{ current_time: string }>(
      "SELECT now()::text AS current_time",
    );

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      databaseTime: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "unhealthy", database: "disconnected" },
      { status: 503 },
    );
  }
}
