import QRCodeGenerator from "@/components/QRCodeGenerator";
import { createRegistration } from "@/lib/actions";

type QRCodePageParams = {
  params: { orderId: string };
};

export default async function QRCodePage({ params }: QRCodePageParams) {
  const { orderId } = await params;

  createRegistration(parseInt(orderId));

  return <QRCodeGenerator orderId={orderId} />;
}
