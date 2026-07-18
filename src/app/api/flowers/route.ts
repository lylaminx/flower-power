import { NextResponse } from "next/server";
import { isSaveFlowerInput } from "@/lib/flower-design";
import { listFlowers, saveFlower } from "@/lib/flower-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ flowers: await listFlowers() });
  } catch (error) {
    console.error("Could not list flowers", error);
    return NextResponse.json(
      { error: "Could not list flowers" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const input: unknown = await request.json();
    if (!isSaveFlowerInput(input)) {
      return NextResponse.json(
        { error: "Invalid flower design" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { flower: await saveFlower(input) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not save flower", error);
    return NextResponse.json(
      { error: "Could not save flower" },
      { status: 503 },
    );
  }
}
