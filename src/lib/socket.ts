import { Server as IOServer } from "socket.io";
import prisma from "@/lib/prisma";
import { NextApiResponseWithSocket } from "../types/socket";
import type { NextApiRequest } from "next";
import { Server as HTTPServer } from "http";

let io: IOServer | undefined;

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket?.server.io) {
    io = new IOServer(res.socket.server as HTTPServer, {
      path: "/api/socket",
    });
    res.socket.server.io = io;

    io.on("connection", async (socket) => {
      socket.on("monitor-event", async (eventId: number) => {
        console.log(`Client monitoring event ${eventId}`);

        const checkedInRegistrations = await prisma.registration.findMany({
          where: {
            eventId: eventId,
          },
        });
        socket.join(eventId.toString());
        socket.emit("update-check-in", checkedInRegistrations);
      });

      socket.on(
        "check-in",
        async ({ qrCodeToken }: { qrCodeToken: string }) => {
          try {
            const registration = await prisma.registration.findUnique({
              where: { qrCodeToken: qrCodeToken },
            });

            if (!registration) {
              throw new Error("Registration not found");
            }

            if (registration.checkedIn) {
              throw new Error("Already checked in");
            }

            const updated = await prisma.registration.update({
              where: { qrCodeToken: qrCodeToken },
              data: {
                checkedIn: true,
                checkInTime: new Date(),
              },
            });

            const updatedCheckedInRegistrations =
              await prisma.registration.findMany({
                where: {
                  eventId: updated.eventId,
                },
              });

            io?.to(updated.eventId.toString()).emit(
              "update-check-in",
              updatedCheckedInRegistrations
            );
          } catch (e) {
            console.error("Check-in error:", e);
          }
        }
      );
    });

    console.log("Socket.IO initialized");
  }

  res.end();
}
