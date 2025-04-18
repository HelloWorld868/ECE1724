import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const { tierId, quantity } = await req.json();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const avail = await prisma.ticketTier.findUnique({
        where: { id: tierId },
        select: {
            quantity: true,
            eventId: true,
            reservations: { select: { quantity: true, status: true } }
        },
    });

    const reserved = avail!.reservations
        .filter(r => r.status === "PENDING")
        .reduce((s, r) => s + r.quantity, 0);
    if (avail!.quantity - reserved >= quantity) {
        return NextResponse.json({ error: "Tickets available" }, { status: 409 });
    }

    const entry = await prisma.waitlistEntry.create({
        data: {
            userId: session.user.id,
            ticketTierId: tierId,
            eventId: avail!.eventId,
            quantity
        }
    });
    return NextResponse.json({ waitlistId: entry.id });
}
