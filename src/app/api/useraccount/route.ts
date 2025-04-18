// app/api/account/update-name/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json();

  if (!name || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  return NextResponse.json({ success: true });
}