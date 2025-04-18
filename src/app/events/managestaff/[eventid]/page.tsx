import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import InviteStaffList from "@/components/InviteStaffList";

export default async function InviteStaffPage({
  params,
}: {
  params: { eventid: string };
}) {
    const session = await auth.api.getSession({ 
      headers: await headers() 
    });
    
    const user = session?.user;
    if (!user) redirect("/signin");
    
    const { eventid } = await params;
    const eventId = parseInt(eventid);
    
    if (isNaN(eventId)) throw new Error("Invalid event ID");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new Error("Event not found");
    if (event.ownerid !== user.id) redirect("/events/manage");

    // Fetch all users except current user
    const allUsers = await prisma.user.findMany({
      where: { id: { not: user.id } },
      orderBy: { name: "asc" },
    });

    // Fetch already invited staff
    const invited = await prisma.eventStaff.findMany({
      where: { eventId },
      select: { userId: true },
    });

    const invitedUserIds = invited.map((s) => s.userId);

    return (
        <div className="max-w-2xl mx-auto px-6 py-10 text-gray-900 dark:text-gray-100">
          <h1 className="text-2xl font-bold mb-6">Manage Staff of {event.name}</h1>

          <form
            method="POST"
            action={`/api/events/managestaff/${eventId}`}
            className="space-y-6"
          >
          <InviteStaffList allUsers={allUsers} invitedUserIds={invitedUserIds} />

          <div className="flex items-center justify-between pt-6">
            <Link href={`/events/manage`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Invite Selected</Button>
          </div>
        </form>
      </div>
    );
}