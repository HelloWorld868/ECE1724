import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";

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
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex justify-center items-center">
      <main className="w-full max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
          <div className="mb-8 text-center">

            <h1 className="text-2xl sm:text-3xl font-bold dark:text-green-400 mb-3">
              Order Confirmed!
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 border-b pb-2">Order Details</h2>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order ID:</span> 
                <span>{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Event:</span> 
                <span className="font-bold">{order.event.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Ticket Tier:</span>
                <span>{order.ticketTier.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Quantity:</span> 
                <span>{order.quantity}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                  <span>Total Payment:</span>
                  <span>${order.totalAmount}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span> 
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 py-1 px-3 rounded-full font-medium text-xs sm:text-sm">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Link href={`/orders/${order.id}/qrcode`} className="w-full">
              <Button variant="default" size="lg" className="w-full text-sm">
                Get QR Code
              </Button>
            </Link>
            <Link href={`/user/${userId}`} className="w-full">
              <Button variant="outline" size="lg" className="w-full text-sm">
                Return to Events
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
