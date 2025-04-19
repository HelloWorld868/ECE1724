import { Storage } from "@google-cloud/storage";
import path from "path";
import QRCode from "qrcode";

const storage = new Storage({
  keyFilename: path.join(process.cwd(), "gcs-key.json"),
});

const bucket = storage.bucket("ticket-qrcode");

export async function getOrCreateQRCodeUrl(orderId: string): Promise<string> {
  const filename = `qrcodes/${orderId}.png`;
  const file = bucket.file(filename);

  const [exists] = await file.exists();

  if (!exists) {
    const qrBuffer = await QRCode.toBuffer(orderId, { type: "png" });
    await file.save(qrBuffer, {
      contentType: "image/png",
      resumable: false,
    });
  }
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}
