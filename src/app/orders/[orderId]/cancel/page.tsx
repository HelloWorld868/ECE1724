import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import RefundForm from "@/components/orders/RefundForm";
import EventDetails from "@/components/tickets/EventDetails";

export const metadata = {
  title: "Request Refund",
  description: "Request a refund for your order",
};

export default async function RefundOrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  if (!user) {
    redirect("/signin");
  }

  const { orderId } = await Promise.resolve(params);

  // Fetch the order with related event details
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      event: true,
      ticketTier: true,
    },
  });

  // If order doesn't exist or doesn't belong to user
  if (!order || order.userId !== user.id) {
    redirect(`/user/${user.id}/myevents`);
  }

  // Check if order can be refunded (only CONFIRMED orders can be refunded)
  const canRefund = order.status === "CONFIRMED";

  return (
    <div className="w-screen min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 sm:gap-0">
          <h1 className="text-2xl sm:text-4xl font-bold">{order.event.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Link href={`/user/${user.id}/myevents`}>
              <Button variant="outline" size="sm" className="text-sm sm:text-lg px-4 sm:px-6 py-2">
                My Events
              </Button>
            </Link>
          </div>
        </div>
  
        {/* Event details component */}
        <EventDetails event={order.event} />
  
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800 mt-8">
          <div className="p-4 sm:p-8 space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-xl">
                <div>
                  <span className="font-medium">Ticket Type:</span>
                  <p>{order.ticketTier.name}</p>
                </div>
                <div>
                  <span className="font-medium">Quantity:</span>
                  <p>{order.quantity}</p>
                </div>
                <div>
                  <span className="font-medium">Order ID:</span>
                  <p>#{order.id}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p>
                    <span className={order.status === "CONFIRMED" ? "text-green-600 font-medium" : ""}>
                      {order.status}
                    </span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Total Amount:</span>
                  <p className="text-xl sm:text-2xl font-bold">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
  
            {canRefund ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 sm:p-6 rounded-lg">
                  <h4 className="text-lg sm:text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-4">
                    Refund Information
                  </h4>
                  <ul className="list-disc list-inside text-sm sm:text-lg text-yellow-700 dark:text-yellow-400 space-y-2">
                    <li>Refund will be processed to your original payment method</li>
                    <li>Refund is permanent and cannot be reversed</li>
                  </ul>
                </div>
  
                <RefundForm 
                  orderId={order.id} 
                  userId={user.id} 
                  eventId={order.eventId} 
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-base sm:text-xl text-gray-700 dark:text-gray-300 mb-6">
                  This order cannot be refunded because it is in {order.status} status.
                </p>
                <Link href={`/user/${user.id}/events/${order.eventId}`}>
                  <Button variant="outline" className="text-sm sm:text-lg py-3 px-6 sm:px-8">
                    Back to Tickets
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
} 