import { Event } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{event.name}</h2>
      
      <div className="space-y-2.5">
        <div>
          <h3 className="text-sm font-medium text-gray-600">Type</h3>
          <p className="text-base text-gray-700">{event.type}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600">Location</h3>
          <p className="text-base text-gray-700">{event.location}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600">Start Time</h3>
          <p className="text-base text-gray-700">
            {format(new Date(event.startTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600">End Time</h3>
          <p className="text-base text-gray-700">
            {format(new Date(event.endTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Button 
          asChild
          className="w-full"
          size="sm"
        >
          <Link href={`/events/${event.id}/tickets`}>
            Get Tickets
          </Link>
        </Button>
      </div>
    </div>
  );
}
