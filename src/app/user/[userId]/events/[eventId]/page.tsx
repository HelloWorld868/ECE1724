import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const metadata = {
  title: "My Event Tickets",
  description: "View tickets for this event",
};

export default async function UserEventTicketsPage({
  params,
}: {
  params: { userId: string; eventId: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const { userId, eventId } = await Promise.resolve(params);

  if (!user || user.id !== userId) {
    redirect("/signin");
  }

  const eventIdNum = parseInt(eventId);

  // get event details
  const event = await prisma.event.findUnique({
    where: { id: eventIdNum },
  });

  if (!event) {
    redirect("/events");
  }

  // get all tickets purchased by the user for this event
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      eventId: eventIdNum,
    },
    include: {
      ticketTier: true,
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="w-screen bg-neutral-100 dark:bg-neutral-900 py-4 sm:py-6 shadow-md">
        <div className="flex justify-between items-center px-4 sm:px-10">
          <h1 className="text-xl sm:text-3xl font-bold">My Tickets</h1>
          <Link href={`/user/${userId}/myevents`}>
            <Button variant="outline" className="text-sm px-4 sm:px-6 py-2">
              My Events
            </Button>
          </Link>
        </div>
      </header>
  
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 sm:p-6 rounded-lg mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-base sm:text-lg">
            {format(new Date(event.startTime), "MMMM d, yyyy 'at' h:mm a")}
          </p>
          <p className="text-base sm:text-lg">{event.location}</p>
        </div>
  
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Your Tickets</h2>
  
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg sm:text-xl mb-6">You don't have any tickets for this event yet.</p>
            <Link href={`/events/${event.id}/tickets`}>
              <Button>Get Tickets</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-blue-50 dark:bg-blue-900 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Purchased on {format(new Date(order.createdAt), "PPP")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
  
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div>
                      <p className="font-medium text-base sm:text-lg">
                        Ticket Type: <span className="font-normal">{order.ticketTier.name}</span>
                      </p>
                      <p className="font-medium text-base sm:text-lg">
                        Quantity: <span className="font-normal">{order.quantity}</span>
                      </p>
                      <p className="font-medium text-base sm:text-lg">
                        Total Amount: <span className="font-normal">${order.totalAmount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
  
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 pt-4 border-t justify-center">
                    {order.status === "CONFIRMED" && (
                      <>
                        <Button
                          asChild
                          className="bg-black hover:bg-gray-800 text-white w-full sm:w-40"
                          size="sm"
                        >
                          <Link href={`/orders/${order.id}/qrcode`}>Show QR Code</Link>
                        </Button>
  
                        <Button
                          asChild
                          variant="outline"
                          className="w-full sm:w-40"
                          size="sm"
                        >
                          <Link href={`/orders/${order.id}/cancel`}>Cancel Order</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
  
}

function getStatusColor(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    case "REFUNDED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  }
} 