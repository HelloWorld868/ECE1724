import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteEventButton from "@/components/DeleteEventButton";

export default async function ManageEventsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    if (!user) redirect("/signin");

    const events = await prisma.event.findMany({
        where: { ownerid: user.id },
        orderBy: { startTime: "asc" },
    });

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold mb-8">Manage My Events</h1>
        {events.length === 0 ? (
            <p className="text-sm">You haven't created any events yet.</p>
        ) : (
            <ul className="space-y-6">
            {events.map((event) => (
                <li key={event.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: {event.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Location: {event.location}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start Time: {event.startTime.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    End Time: {event.endTime.toLocaleString()}
                </p>
                <div className="mt-4 space-x-4">
                    <Link href={`/events/managestaff/${event.id}`}>
                    <Button variant="default">Manage Staff</Button>
                    </Link>
                    <Link href={`/events/edit/${event.id}`}>
                    <Button variant="default">Edit</Button>
                    </Link>
                    <DeleteEventButton eventid={event.id.toString()} />
                </div>
                </li>
            ))}
            <div className="mt-12">
                <Link href={`/user/${user.id}/myevents`}>
                    <Button variant= "outline">Back to My Events</Button>
                </Link>
            </div>
            </ul>
        )}
        </div>
    );
}