"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  onScan: (decodedText: string) => void;
};

export default function QRCodeScanner({ onScan }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanned = useRef<string | null>(null);
  const isProcessing = useRef<boolean>(false);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1,
        };

        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isProcessing.current) return;
            if (decodedText !== lastScanned.current) {
              isProcessing.current = true;
              lastScanned.current = decodedText;
            }
            setScanResult(decodedText);
            try {
              onScan(decodedText);
            } catch (err) {
              console.error("Error in onScan:", err);
            }
            setTimeout(() => {
              isProcessing.current = false;
            }, 1500);
          },
          (scanError) => {
            console.warn("Scan error:", scanError);
          }
        );
      } catch (err: any) {
        console.error("Failed to start QR scanner:", err);
        setError(err.message || "Unable to access camera.");
      }
    };

    startScanner();

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 min-w-[300px]">
        <div id={qrCodeRegionId} className="w-full max-w-md aspect-square" />
        <div>
          {scanResult ? (
            <Badge variant="default">Scanned: {scanResult}</Badge>
          ) : error ? (
            <Badge variant="destructive">Error: {error}</Badge>
          ) : (
            <Badge variant="secondary">Scanning...</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
