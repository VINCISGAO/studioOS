import { NextResponse } from "next/server";
import { uploadMultipartObjectPart } from "@/lib/studioos/object-storage";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const { getCurrentCreatorId } = await import("@/lib/creator-session");
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const key = url.searchParams.get("key") ?? "";
  const partNumber = Number(url.searchParams.get("partNumber") ?? "0");
  if (!uploadId || !key || !Number.isInteger(partNumber) || partNumber < 1) {
    return NextResponse.json({ ok: false, error: "Invalid upload part request" }, { status: 400 });
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (!body.length) {
    return NextResponse.json({ ok: false, error: "Empty upload part" }, { status: 400 });
  }

  let part: Awaited<ReturnType<typeof uploadMultipartObjectPart>>;
  try {
    part = await uploadMultipartObjectPart({
      key,
      uploadId,
      partNumber,
      body
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to upload video part"
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, part });
}
