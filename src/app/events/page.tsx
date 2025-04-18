import Link from "next/link";
import { Suspense } from "react";
import EventList from "@/components/EventList";
import { Event } from "@prisma/client";

async function getEvents(): Promise<{
  events: Event[];
  error: string | null;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/events`);
    
    console.log("Fetching events from:", `${baseUrl}/api/events`);
    
    const events: Event[] = await res.json();
    return { events: events, error: null };
  } catch {
    return { events: [], error: "Error loading events" };
  }
}

async function EventsSection() {
  const { events, error } = await getEvents();
  return error ? (
    <p className="text-sm">{error}</p>
  ) : (
    <EventList events={events} />
  );
}

function Loading() {
  return <p>Loading events...</p>;
}

export default async function AllEvents() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Events</h1>
      <section>
        {
          <Suspense fallback={<Loading />}>
            <EventsSection />
          </Suspense>
        }
      </section>
      <nav className="space-x-4">
        <Link
          href="/events/create"
          className="inline-block px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition duration-200"
        >
          Create New Event
        </Link>
      </nav>
    </div>
  );
}

export const dynamic = "force-dynamic";
