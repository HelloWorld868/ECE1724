// Server component for displaying event details
import { format } from "date-fns";
import { Event } from "@prisma/client";

// Type for component props
interface EventDetailsProps {
  event: Event;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const imageUrl = event.images?.[0] || "/default-bg.jpg";

  return (
    <div
      className="relative bg-gray-900 text-white rounded-lg shadow-md overflow-hidden h-48 sm:h-64 md:h-96 flex flex-col justify-between mb-4 sm:mb-6 md:mb-8"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between">
        <div>
          <div className="space-y-1 sm:space-y-2 md:space-y-3 text-gray-200">
            <p className="text-base sm:text-lg md:text-xl"><strong className="text-base sm:text-lg md:text-xl">Type:</strong> {event.type}</p>
            <p className="text-base sm:text-lg md:text-xl"><strong className="text-base sm:text-lg md:text-xl">Location:</strong> {event.location}</p>
            <p className="text-base sm:text-lg md:text-xl"><strong className="text-base sm:text-lg md:text-xl">Start:</strong> {format(new Date(event.startTime), "MMMM d, yyyy h:mm a")}</p>
            <p className="text-base sm:text-lg md:text-xl"><strong className="text-base sm:text-lg md:text-xl">End:</strong> {format(new Date(event.endTime), "MMMM d, yyyy h:mm a")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}