// Server component for fetching and displaying event data
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import EventDetails from "@/components/tickets/EventDetails";
import TicketSection from "@/components/tickets/TicketSection";
import { Button } from "@/components/ui/button";

export default async function EventTicketsPage({
  params,
}: {
  params: { eventId: string };
}) {
  // Get the eventId from params
  const paramsData = await Promise.resolve(params);
  const eventId = paramsData.eventId;
  
  // Fetch event data from the database
  const event = await prisma.event.findUnique({
    where: { id: parseInt(eventId) },
    include: {
      TicketTiers: {
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
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">{event.name}</h1>
        <Link href="/events">
          <Button variant="outline" size="sm">
            ← Back to Events
          </Button>
        </Link>
      </div>
      
      {/* Event details component (server component) */}
      <EventDetails event={event} />
      
      {/* Ticket section component (client component) */}
      <TicketSection tickets={event.TicketTiers} eventId={eventId} />
    </div>
  );
}