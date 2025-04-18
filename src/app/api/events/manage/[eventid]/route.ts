import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { eventid: string } }
  ) {
  
    const session = await auth.api.getSession({ 
        headers: await headers(),
    });
  
    const user = session?.user;
  
    const { eventid } = await params;
    console.log("Raw eventId param:", eventid);
  
    const parsedId = parseInt(eventid);
    console.log("Parsed eventId:", parsedId);
  
    if (!user || isNaN(parsedId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const event = await prisma.event.findUnique({ where: { id: parsedId } });
  
    if (!event || event.ownerid !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    /* need to add logic to delete all attendees */
    ////////////////////////////////////////////////////////////////
    await prisma.eventStaff.deleteMany({ where: { eventId: parsedId } });
    await prisma.event.delete({ where: { id: parsedId } });
  
    return NextResponse.json({ success: true });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { eventId: string } }
    ) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    const user = session?.user;
    const eventId = parseInt(params.eventId);

    console.log("Parsed eventId:", eventId);
    console.log("Session user ID:", user?.id);

    if (!user || isNaN(eventId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, location, startTime, endTime } = body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.ownerid !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.event.update({
        where: { id: eventId },
        data: {
        name,
        type,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        },
    });

    return NextResponse.json({ success: true });
}