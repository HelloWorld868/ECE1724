import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { EventType } from "@prisma/client";
import { uploadImageToGCS } from "@/lib/gcs-upload";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("Failed to load events:", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const type = formData.get("type") as EventType;
    const location = formData.get("location") as string;
    const startTime = new Date(formData.get("startTime") as string);
    const endTime = new Date(formData.get("endTime") as string);
    const ownerid = user.id;
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filename = `${Date.now()}-${i}-${file.name}`;
      const url = await uploadImageToGCS(file, filename);
      imageUrls.push(url);
    }

    const event = await prisma.event.create({
      data: {
        name,
        type,
        location,
        startTime,
        endTime,
        ownerid,
        images: imageUrls,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
