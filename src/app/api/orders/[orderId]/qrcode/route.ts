import { getOrCreateQRCodeUrl } from "@/lib/gcs-qrcode";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = await Promise.resolve(params);

  if (!orderId) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  try {
    const url = await getOrCreateQRCodeUrl(orderId);
    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
