import {auth} from "@/lib/auth";
import prisma from "@/lib/prisma";
import {headers} from "next/headers";
import {NextResponse} from "next/server";

export async function GET(req: Request) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session?.user) return NextResponse.json({joined: false});

    const {searchParams} = new URL(req.url);
    const tierId = parseInt(searchParams.get("tierId") || "", 10);
    if (!tierId) return NextResponse.json({joined: false});

    const existing = await prisma.waitlistEntry.findFirst({
        where: {
            userId: session.user.id,
            ticketTierId: tierId,
            status: {in: ["WAITING", "NOTIFIED"]},
        },
    });

    return NextResponse.json({joined: !!existing});
}
