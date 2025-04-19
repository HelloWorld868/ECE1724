import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EventForm } from "@/components/EventForm";
import { EventType } from "@prisma/client";
import { uploadImageToGCS, bucket } from "@/lib/gcs-upload";

export default async function EditEventPage({
  params,
}: {
  params: { eventid: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const { eventid } = await params;
  const eventId = parseInt(eventid);

  if (!user) redirect("/signin");
  if (isNaN(eventId)) throw new Error(`Invalid event ID: ${params.eventid}`);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error(`Event with ID ${eventId} not found`);
  if (event.ownerid !== user.id) throw new Error(`Unauthorized access`);

  async function updateEvent(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const location = formData.get("location") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (!Object.values(EventType).includes(capitalizedType as EventType)) {
      throw new Error(`Invalid event type: ${type}`);
    }

    const rawImages = formData.getAll("images");
    const imageFiles = rawImages.filter(
      (file): file is File =>
        file instanceof File &&
        typeof file.name === "string" &&
        file.name.trim() !== "" &&
        file.size > 0
    );

    let imageUrls: string[] = event?.images || [];

    // 🔄 Replace images if new ones uploaded
    if (imageFiles.length > 0) {
      for (const url of imageUrls) {
        const match = url.match(/\/events\/(.+)$/);
        if (match?.[1]) {
          try {
            await bucket.file(`events/${match[1]}`).delete();
            console.log(`Deleted old image: events/${match[1]}`);
          } catch (err) {
            console.error(`Failed to delete image: events/${match[1]}`, err);
          }
        }
      }

      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filename = `${Date.now()}-${i}-${file.name}`;
        const url = await uploadImageToGCS(file, filename);
        uploadedUrls.push(url);
      }

      imageUrls = uploadedUrls;
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        type: capitalizedType as EventType,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        images: imageUrls,
      },
    });

    redirect("/events/manage");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm action={updateEvent} initialData={event}/>
    </div>
  );
}