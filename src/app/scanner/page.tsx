"use client";

import QRCodeScanner from "@/components/QRCodeScanner";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "@/lib/socketManager";

export default function ScannerPage() {
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    socketRef.current = getSocket("scanner");

    return () => {
      disconnectSocket("scanner");
    };
  }, []);

  const handleCheckIn = (qrCodeToken: string) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected");
      return;
    }

    console.log("Emitting check-in for token:", qrCodeToken);
    socketRef.current.emit("check-in", { qrCodeToken });
  };

  return (
    <div className="p-4">
      <QRCodeScanner onScan={handleCheckIn} />
    </div>
  );
}
