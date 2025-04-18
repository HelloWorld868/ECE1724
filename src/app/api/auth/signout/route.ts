import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    await auth.api.signOut({
      headers: await headers(),
    });
  }

  return NextResponse.json({ success: true });
} 