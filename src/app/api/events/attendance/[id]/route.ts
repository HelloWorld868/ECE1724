import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;
  try {
    const registrations = await prisma.registration.findMany({
      where: { eventId: Number(id) },
      include: {
        user: true,
      },
    });

    type TimeSlotAccumulator = Record<string, number>;
    const checkInCountOverTime = registrations.reduce<TimeSlotAccumulator>(
      (acc, registration) => {
        if (registration.checkedIn) {
          const checkInTime = new Date(registration.checkInTime);
          const hour = checkInTime.getHours();
          const minute = checkInTime.getMinutes();
          const timeSlot = `${hour}:${minute < 10 ? "0" + minute : minute}`;
          acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const checkInCount = registrations.filter((r) => r.checkedIn).length;

    return NextResponse.json({
      checkInCount,
      registrations,
      checkInCountOverTime: Object.entries(checkInCountOverTime).map(
        ([timeSlot, count]) => ({
          timeSlot,
          count,
        })
      ),
    });
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
