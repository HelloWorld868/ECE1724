// Server component for displaying event details
import { format } from "date-fns";
import { Event } from "@prisma/client";

// Type for component props
interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-3xl font-semibold mb-4">Event Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-lg text-gray-600">Event Type</p>
          <p className="text-2xl font-medium">{event.type}</p>
        </div>
        <div>
          <p className="text-lg text-gray-600">Location</p>
          <p className="text-2xl font-medium">{event.location}</p>
        </div>
        <div>
          <p className="text-lg text-gray-600">Start time</p>
          <p className="text-2xl font-medium">
            {format(new Date(event.startTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div>
          <p className="text-lg text-gray-600">End Time</p>
          <p className="text-2xl font-medium">
            {format(new Date(event.endTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
}