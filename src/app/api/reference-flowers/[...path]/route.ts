import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";

const referenceRoot = path.join(process.cwd(), "references", "flowers");

export const runtime = "nodejs";

function resolveReferencePath(segments: string[]) {
  if (segments.length < 2) return null;
  const [speciesSegment, ...fileSegments] = segments;
  const decodedSpecies = decodeURIComponent(speciesSegment);
  const decodedFile = fileSegments.map((segment) => decodeURIComponent(segment));
  const safeRoot = path.resolve(referenceRoot);
  const filePath = path.resolve(safeRoot, decodedSpecies, ...decodedFile);
  if (!filePath.startsWith(`${safeRoot}${path.sep}`)) return null;
  return filePath;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = resolveReferencePath(segments);
  if (!filePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".json"
          ? "application/json; charset=utf-8"
          : "application/octet-stream";

    return new NextResponse(Readable.toWeb(createReadStream(filePath)) as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
