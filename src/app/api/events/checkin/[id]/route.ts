import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Registration } from "@prisma/client";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
): Promise<NextResponse<Registration[]>> {
  const { id } = await params;
  const eventId = parseInt(id, 10);
  const registrations = await prisma.registration.findMany({
    where: { eventId: eventId },
    include: { user: true },
  });
  return NextResponse.json(registrations);
}
