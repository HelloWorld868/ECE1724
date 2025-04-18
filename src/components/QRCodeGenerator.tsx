import { QRCodeSVG } from "qrcode.react";

type Props = {
  orderId: string;
};

export default function QRCodeGenerator({ orderId }: Props) {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {!orderId && <p>Order ID is missing. Cannot generate QR code.</p>}

      {orderId && (
        <div>
          <h1>QR Code for Order ID: {orderId}</h1>
          <div className="flex flex-col items-center space-y-6 mt-15">
            <QRCodeSVG value={`${orderId}`} />
          </div>
        </div>
      )}
    </div>
  );
}
