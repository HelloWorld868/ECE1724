import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code, eventId } = await request.json();

    console.log("Received request:", {
      code,
      eventId,
      eventIdType: typeof eventId
    });

    if (!code || !eventId) {
      return NextResponse.json(
        { error: "Discount code and event ID are required" },
        { status: 400 }
      );
    }

    const discountCode = await prisma.discountCode.findFirst({
      where: {
        code: code,
        eventId: parseInt(eventId.toString()),
      },
    });

    console.log("Database query result:", {
      discountCode,
      queryParams: {
        code,
        eventId: parseInt(eventId.toString())
      }
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 404 }
      );
    }

    // Check usage count
    if (discountCode.maxUses !== null && discountCode.currentUses >= discountCode.maxUses) {
      return NextResponse.json(
        { error: "Discount code has reached maximum usage" },
        { status: 400 }
      );
    }

    // Check validity period
    const now = new Date();
    if (discountCode.startDate && now < discountCode.startDate) {
      return NextResponse.json(
        { error: "Discount code is not yet active" },
        { status: 400 }
      );
    }
    if (discountCode.endDate && now > discountCode.endDate) {
      return NextResponse.json(
        { error: "Discount code has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
} 