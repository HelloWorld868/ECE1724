import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EventList from "@/components/EventList";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function MyEventsPage({
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

  const createdEvents = await prisma.event.findMany({
    where: { ownerid: user.id },
    orderBy: { startTime: "asc" },
  });

  const managedEvents = await prisma.event.findMany({
    where: { staff: { some: { userId: user.id } } },
    orderBy: { startTime: "asc" },
  });

  
  const boughtEvents: typeof createdEvents = [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Top Banner */}
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
  
        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-8">My Events</h1>
    
            {/* Events I Created */}
            <section className="mb-12">
            <h2 className="text-2xl font-semibold">Events I Created</h2>
            <div className="flex space-x-4 mb-6">
                <Link href="/events/create">
                <Button variant="default" size="sm">Create New Event</Button>
                </Link>
                <Link href="/events/manage">
                <Button variant="default" size="sm">Manage My Events</Button>
                </Link>
            </div>
            {createdEvents.length === 0 ? (
                <p className="text-sm">You haven't created any events yet.</p>
            ) : (
                <EventList events={createdEvents} />
            )}
            </section>
    
            {/* Events I Managed */}
            <section className="mb-12">
            <h2 className="text-2xl font-semibold">Events I Managed</h2>
            <div className="flex space-x-4 mb-6">
                <Link href="">
                <Button variant="default" size="sm">Scan Code</Button>
                </Link>
            </div>
            {managedEvents.length === 0 ? (
                <p className="text-sm">You're not managing any events right now.</p>
            ) : (
                <EventList events={managedEvents} />
            )}
            </section>
    
            {/* Events I Bought */}
            <section className="mb-12">
            <h2 className="text-2xl font-semibold">Events I Bought</h2>
            <div className="flex space-x-4 mb-6">
                <Link href="">
                <Button variant="default" size="sm">Manage My Tickets</Button>
                </Link>
            </div>
            {boughtEvents.length === 0 ? (
                <p className="text-sm">You haven't bought tickets to any events.</p>
            ) : (
                <EventList events={boughtEvents} />
            )}
            </section>
            
            <div className="flex justify-center mb-6">
                <Link href={`/user/${user.id}`}>
                <Button variant="outline" className="text-lg px-6 py-2">Back to Home Page</Button>
                </Link>
            </div>
        </main>
    </div>
  );  
}
