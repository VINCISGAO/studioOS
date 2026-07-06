import { NextResponse } from "next/server";
import { uploadMultipartObjectPart } from "@/lib/studioos/object-storage";

export const runtime = "nodejs";

function parseReviewVideoKey(key: string) {
  const match = /^review\/([^/]+)\/v(\d+)\.(mp4|mov)$/.exec(key);
  if (!match) {
    return null;
  }
  const version = Number(match[2]);
  if (!Number.isInteger(version) || version < 1) {
    return null;
  }
  return { orderId: match[1], version, extension: match[3] as "mp4" | "mov" };
}

export async function PUT(request: Request) {
  const [{ getCurrentCreatorId }, { getOrder }] = await Promise.all([
    import("@/lib/creator-session"),
    import("@/lib/order-service")
  ]);
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

  const parsedKey = parseReviewVideoKey(key);
  if (!parsedKey) {
    return NextResponse.json({ ok: false, error: "Invalid upload part request" }, { status: 400 });
  }

  const order = await getOrder(parsedKey.orderId);
  if (!order || order.creator_id !== creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
