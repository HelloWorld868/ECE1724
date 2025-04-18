import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EventForm } from "@/components/EventForm";
import { EventType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditEventPage({
  params,
}: {
  params: { eventid: string };
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    const { eventid } = await params;
    const eventId = parseInt(eventid);

    if (!user) redirect("/signin");

    if (isNaN(eventId)) {
        throw new Error(`Invalid event ID: ${params.eventid}`);
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
    }
      
    if (event.ownerid !== user.id) {
        throw new Error(`Unauthorized access to event ID ${eventId}`);
    }

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

        await prisma.event.update({
            where: { id: eventId },
            data: {
                name,
                type: capitalizedType as EventType,
                location,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
        });

        redirect("/events/manage");
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
            <EventForm 
                action={updateEvent}
                initialData={event}
            />
        </div>
    );
}