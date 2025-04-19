import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const paramsData = await Promise.resolve(params);
  const orderId = parseInt(paramsData.orderId);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      ticketTier: true,
      discountCode: true,
    },
  });

  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const userId = user?.id;

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/signin");
  }
  

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        <div className="mb-8 text-left">
          <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Order ID:</span> {order.id}
            </p>
            <p>
              <span className="font-medium">Event:</span> {order.event.name}
            </p>
            <p>
              <span className="font-medium">Ticket Tier:</span>{order.ticketTier.name}
            </p>
            <p>
              <span className="font-medium">Quantity:</span> {order.quantity}
            </p>

            <div className="border-t border-gray-200 my-4 pt-4">
              <p className="font-medium">
                Total Payment: ${order.totalAmount}{" "}
              </p>
            </div>

            <p>
              <span className="font-medium">Status:</span> {order.status}
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link href={`/orders/${order.id}/qrcode`}>
            <Button variant="default" size="sm">Get QR Code</Button>
          </Link>
          {user && (
            <Link href={`/user/${userId}`}>
              <Button variant="default" size="sm">
                Return to Events
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
