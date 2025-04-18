// src/app/user/[userId]/page.tsx

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Event } from "@prisma/client";
import EventList from "@/components/EventList";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/auth/SignOutButton";

async function getEvents(): Promise<{ events: Event[]; error: string | null }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/events`, { cache: "no-store" });
    const events = await res.json();
    return { events, error: null };
  } catch {
    return { events: [], error: "Error loading events" };
  }
}

export default async function UserHomePage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const { userId } = await params;

  if (!user || user.id !== userId) {
    redirect("/signin");
  }

  const { events, error } = await getEvents();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="w-screen bg-neutral-100 dark:bg-neutral-900 py-6 shadow-md">
        <div className="flex justify-between items-center px-10">
          <h1 className="text-3xl font-bold">
            Hello, {user.name || "User"}
          </h1>
          <div className="space-x-6">
            <Link href={`/user/${user.id}/account`}>
              <Button variant="outline" className="text-sm px-6 py-2">Manage Account</Button>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-12 px-6 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Events Now ON</h1>
          {/* <Link href="/tickets">
            <Button variant="default" className="px-5 py-2 mb-4">Buy Tickets</Button>
          </Link> */}
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <Suspense fallback={<p>Loading events...</p>}>
              <EventList events={events} />
            </Suspense>
          )}
        </div>

        <div className="text-center">
          <Link href={`/user/${user.id}/myevents`}>
            <Button className="text-lg px-6 py-2">View My Events</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}