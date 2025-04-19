import { Storage } from "@google-cloud/storage";
import { Readable } from "stream";
import path from "path";

const storage = new Storage({
  keyFilename: path.join(process.cwd(), "gcs-key.json"),
});

export const bucket = storage.bucket("event-pic");

export async function uploadImageToGCS(file: File, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileRef = bucket.file(`events/${filename}`);
  const stream = Readable.from(buffer);

  await new Promise((resolve, reject) => {
    stream
      .pipe(
        fileRef.createWriteStream({
          metadata: { contentType: file.type },
          resumable: false,
        })
      )
      .on("error", reject)
      .on("finish", resolve);
  });

  return `https://storage.googleapis.com/${bucket.name}/events/${filename}`;
}