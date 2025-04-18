import prisma from "@/lib/prisma";

export async function remainingTickets(tierId: number) {
    const tier = await prisma.ticketTier.findUnique({
        where: { id: tierId },
        include: {
            Orders: { select: { quantity: true, status: true } },
            reservations: { select: { quantity: true, status: true } },
        },
    });
    if (!tier) return 0;

    const sold = tier.Orders
        .filter(o => o.status === "CONFIRMED")
        .reduce<number>((sum, o) => sum + o.quantity, 0);

    const locked = tier.reservations
        .filter(r => r.status === "PENDING")
        .reduce<number>((sum, r) => sum + r.quantity, 0);

    return tier.quantity - sold - locked;
}
