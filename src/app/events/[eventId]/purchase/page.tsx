import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PurchaseClient from "@/components/purchase/PurchaseClient";

export default async function PurchasePage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { 
    tierId?: string; 
    quantity?: string;
    discountCode?: string;
    discountType?: string;
    discountValue?: string;
    reservationId?: string;
  };
}) {
  const paramsData = await Promise.resolve(params);
  const searchParamsData = await Promise.resolve(searchParams);
  
  const eventId = paramsData.eventId;
  const tierId = searchParamsData.tierId;
  const quantity = searchParamsData.quantity;
  const discountCode = searchParamsData.discountCode;
  const discountType = searchParamsData.discountType;
  const discountValue = searchParamsData.discountValue ? parseFloat(searchParamsData.discountValue) : null;
  const reservationId = searchParamsData.reservationId;

  if (!tierId || !quantity || !reservationId) {
    redirect(`/events/${eventId}/tickets`);
  }

  const event = await prisma.event.findUnique({
    where: { id: parseInt(eventId) },
    include: {
      TicketTiers: true,
    },
  });

  if (!event) {
    notFound();
  }

  const selectedTier = event.TicketTiers.find(
    (tier) => tier.id === parseInt(tierId)
  );

  if (!selectedTier) {
    redirect(`/events/${eventId}/tickets`);
  }

  const basePrice = selectedTier.price * parseInt(quantity);
  let totalPrice = basePrice;

  // 应用折扣
  if (discountCode && discountType && discountValue) {
    if (discountType === 'PERCENTAGE') {
      totalPrice = basePrice * (1 - discountValue / 100);
    } else if (discountType === 'FIXED_AMOUNT') {
      totalPrice = Math.max(0, basePrice - discountValue);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <PurchaseClient
        event={event}
        selectedTier={selectedTier}
        quantity={parseInt(quantity)}
        totalPrice={totalPrice}
        basePrice={basePrice}
        discountCode={discountCode}
        discountType={discountType}
        discountValue={discountValue}
        reservationId={parseInt(reservationId)}
      />
    </div>
  );
}
