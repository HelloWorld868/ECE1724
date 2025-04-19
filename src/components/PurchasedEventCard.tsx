import { Event, Order } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PurchasedEventCardProps {
  event: Event;
  order: Order;
  ticketTierName?: string;
  userId: string;
}

export default function PurchasedEventCard({ event, order, ticketTierName, userId }: PurchasedEventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{event.name}</h2>
      
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Type</h3>
            <p className="text-base text-gray-700">{event.type}</p>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">Location</h3>
            <p className="text-base text-gray-700">{event.location}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600">Start Time</h3>
          <p className="text-base text-gray-700">
            {format(new Date(event.startTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button 
          asChild
          className="bg-black hover:bg-gray-800 text-white w-full"
          size="sm"
        >
          <Link href={`/user/${userId}/events/${event.id}`}>
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
} 