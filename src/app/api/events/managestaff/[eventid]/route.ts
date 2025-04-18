import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request, { params }: { params: { eventid: string } }) {
  const session = await auth.api.getSession({ 
    headers: await headers(), 
  });

  const user = session?.user;
  if (!user) return NextResponse.redirect("/signin");
  
  const { eventid } = await params;
  const eventId = parseInt(eventid);

  if (isNaN(eventId)) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });

  const formData = await req.formData();
  const userIds = formData.getAll("userIds") as string[];

  await prisma.eventStaff.deleteMany({
    where: { eventId },
  });

  await prisma.eventStaff.createMany({
    data: userIds.map((userId) => ({
      eventId,
      userId,
      role: "staff", // default role
    })),
  });

  return NextResponse.redirect(new URL("/events/manage", req.url));
}
