import { NextResponse } from "next/server";
import { clearDemoSession } from "@/lib/demo-auth-server";

export async function POST() {
  await clearDemoSession();
  return NextResponse.json({ success: true, data: { loggedOut: true } });
}
