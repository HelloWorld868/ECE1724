import { Event } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const imageUrl = event.images?.[0] || "/default-bg.jpg";

  return (
    <div
      className="relative bg-gray-900 text-white rounded-lg shadow-md overflow-hidden h-96 flex flex-col justify-between"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
          <div className="text-sm space-y-1 text-gray-200">
            <p><strong>Type:</strong> {event.type}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Start:</strong> {format(new Date(event.startTime), "MMMM d, yyyy h:mm a")}</p>
            <p><strong>End:</strong> {format(new Date(event.endTime), "MMMM d, yyyy h:mm a")}</p>
          </div>
        </div>

        <div className="mt-4">
          <Button asChild >
            <Link href={`/events/${event.id}/tickets`}>Get Tickets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}