import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import path from "path";
import { uploadImageToGCS } from "@/lib/gcs-upload";
import { EventType } from "@prisma/client";

// for Google Cloud Storage
const storage = new Storage({ keyFilename: path.join(process.cwd(), "gcs-key.json") });
const bucket = storage.bucket("event-pic");

export async function DELETE(
    req: NextRequest,
    { params }: { params: { eventid: string } }
  ) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    const user = session?.user;
    const { eventid } = await params;
    const parsedId = parseInt(eventid);
  
    if (!user || isNaN(parsedId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const event = await prisma.event.findUnique({ where: { id: parsedId } });
  
    if (!event || event.ownerid !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  
    // Delete associated images from GCS
    if (event.images && event.images.length > 0) {
      for (const url of event.images) {
        const match = url.match(/\/events\/(.+)$/);
        if (match?.[1]) {
          const filename = `events/${match[1]}`;
          try {
            await bucket.file(filename).delete();
            console.log(`Deleted image from GCS: ${filename}`);
          } catch (err: any) {
            console.error(`Failed to delete image ${filename}:`, err.message);
          }
        }
      }
    }
  
    // Delete related data
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
      
        if (!user || isNaN(eventId)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      
        const existing = await prisma.event.findUnique({ where: { id: eventId } });
      
        if (!existing || existing.ownerid !== user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      
        const formData = await req.formData();
      
        const name = formData.get("name") as string;
        const type = formData.get("type") as EventType;
        const location = formData.get("location") as string;
        const startTime = new Date(formData.get("startTime") as string);
        const endTime = new Date(formData.get("endTime") as string);
      
        // 🔍 Extract new image files
        const rawImages = formData.getAll("images");
        const imageFiles = rawImages.filter(
          (file): file is File =>
            file instanceof File &&
            typeof file.name === "string" &&
            file.name.trim() !== "" &&
            file.size > 0
        );
      
        console.log("🧾 Filtered image files:", imageFiles.map(f => f.name));
      
        let newImageUrls: string[] = [];
      
        // 🧹 Delete old images from GCS if new ones are provided
        if (imageFiles.length > 0 && existing.images?.length > 0) {
          for (const url of existing.images) {
            const match = url.match(/\/events\/(.+)$/);
            if (match?.[1]) {
              const filename = `events/${match[1]}`;
              try {
                await bucket.file(filename).delete();
                console.log(`🗑️ Deleted old image: ${filename}`);
              } catch (err: any) {
                console.error(`⚠️ Failed to delete image: ${filename}`, err.message);
              }
            }
          }
        }
      
        // 📤 Upload new images to GCS
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const filename = `${Date.now()}-${i}-${file.name}`;
          const url = await uploadImageToGCS(file, filename);
          newImageUrls.push(url);
        }
      
        console.log("📤 Uploaded new image URLs:", newImageUrls);
      
        // 🛠 Update database
        const updateData: any = {
          name,
          type,
          location,
          startTime,
          endTime,
        };
      
        if (newImageUrls.length > 0) {
          updateData.images = newImageUrls;
        }
      
        await prisma.event.update({
          where: { id: eventId },
          data: updateData,
        });
      
        return NextResponse.json({ success: true });
      }