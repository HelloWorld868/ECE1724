import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import RefundForm from "@/components/orders/RefundForm";

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
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="w-screen bg-neutral-100 dark:bg-neutral-900 py-6 shadow-md">
        <div className="flex justify-between items-center px-10">
          <h1 className="text-3xl font-bold">Request Refund</h1>
          <Link
            href={`/user/${user.id}/events/${order.eventId}`}
            className="text-base font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Tickets
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900 p-6">
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">Request a Refund</h2>
            <p className="text-blue-600 dark:text-blue-400 mt-2">
              Please read carefully before proceeding:
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold mb-2">{order.event.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {format(new Date(order.event.startTime), "PPP")} at{" "}
                {format(new Date(order.event.startTime), "p")}
              </p>
              <p className="text-sm">
                <span className="font-medium">Order ID:</span> #{order.id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{" "}
                <span className={order.status === "CONFIRMED" ? "text-green-600" : ""}>
                  {order.status}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Amount:</span>{" "}
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>

            {canRefund ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Important Information
                  </h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                    <li>Refund is permanent and cannot be undone.</li>
                    <li>Your tickets will be released back into the event inventory.</li>
                    <li>The refund will be processed back to your original payment method.</li>
                    <li>Refund processing may take 5-7 business days.</li>
                  </ul>
                </div>

                <RefundForm 
                  orderId={order.id} 
                  userId={user.id} 
                  eventId={order.eventId} 
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  This order cannot be refunded because it is in {order.status} status.
                </p>
                <Link href={`/user/${user.id}/events/${order.eventId}`}>
                  <Button variant="outline">Back to Tickets</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 