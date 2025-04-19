"use client";

import { useEffect, useState } from "react";

type Props = {
  orderId: string;
};

export default function QRCodeGenerator({ orderId }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || typeof orderId !== "string") return;

    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}/qrcode`);
        const data = await res.json();

        if (res.ok) {
          setQrUrl(data.url);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {!orderId && <p>Order ID is missing. Cannot generate QR code.</p>}

      {orderId && (
        <div>
          <h1>QR Code for Order ID: {orderId}</h1>
          <div className="flex flex-col items-center space-y-6 mt-15">
            {loading ? (
              <p>Loading...</p>
            ) : qrUrl ? (
              <img src={qrUrl} alt="QR Code" width={200} height={200} />
            ) : (
              <p>Could not get QR Code.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
