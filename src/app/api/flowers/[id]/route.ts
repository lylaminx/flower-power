import { NextResponse } from "next/server";
import { getFlower } from "@/lib/flower-repository";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid flower id" }, { status: 400 });
  }

  try {
    const flower = await getFlower(id);
    if (!flower) {
      return NextResponse.json({ error: "Flower not found" }, { status: 404 });
    }
    return NextResponse.json({ flower });
  } catch (error) {
    console.error("Could not load flower", error);
    return NextResponse.json(
      { error: "Could not load flower" },
      { status: 503 },
    );
  }
}
