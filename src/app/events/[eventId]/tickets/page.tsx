import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import EventDetails from "@/components/tickets/EventDetails";
import TicketSection from "@/components/tickets/TicketSection";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function EventTicketsPage({
  params,
}: {
  params: { eventId: string };
}) {
  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const userId = user?.id;

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/signin");
  }

  // Get the eventId from params
  const paramsData = await Promise.resolve(params);
  const eventId = paramsData.eventId;

  // Fetch event data from the database
  const event = await prisma.event.findUnique({
    where: { id: parseInt(eventId) },
    include: {
      TicketTiers: {
        include: {
          reservations: true
        },
        orderBy: {
          id: 'asc'
        }
      },
    },
  });
  
  // Handle case where event is not found
  if (!event) {
    notFound();
  }

  // Calculate available tickets for each tier
  const ticketsWithAvailability = event.TicketTiers.map(tier => {
    // Only count PENDING and COMPLETED reservations
    const now = new Date();
    const reservedQuantity = tier.reservations
      .filter(res => res.status === 'PENDING' && new Date(res.expiresAt) > now)
      .reduce((sum, res) => sum + res.quantity, 0);
    
    // Create a new object with calculated availability
    return {
      ...tier,
      quantity: tier.quantity - reservedQuantity,
      reservations: undefined // Remove reservations data before sending to client
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">{event.name}</h1>
        <div className="flex gap-2">
          {user && (
            <Link href={`/user/${userId}`}>
              <Button variant="outline" size="sm">
              ← Back to Events
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Event details component (server component) */}
      <EventDetails event={event} />
      
      {/* Ticket section component (client component) */}
      <TicketSection tickets={ticketsWithAvailability} eventId={eventId} />
    </div>
  );
}