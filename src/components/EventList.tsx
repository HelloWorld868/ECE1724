import { Event } from "@prisma/client";
import EventCard from "./EventCard";

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
  return !events || events.length === 0 ? (
    <p className="text-sm">No Events found</p>
  ) : (
    <ul className="space-y-4" data-testid="Event-list">
      {events.map((event) => (
        <EventCard event={event} key={event.id} />
      ))}
    </ul>
  );
}
