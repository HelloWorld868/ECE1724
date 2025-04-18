"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import type { Registration } from "@prisma/client";
import CheckinTable from "@/components/CheckinTable";
import { getSocket, disconnectSocket } from "@/lib/socketManager";

type Props = {
  eventId: string;
};

export default function DashboardClient({ eventId }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/events/checkin/${eventId}`);
      const data = await res.json();
      setRegistrations(data);
    };

    fetchData();

    socketRef.current = getSocket("dashboard");
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("monitor-event", Number(eventId));
    });

    socketRef.current.on("update-check-in", (updated: Registration[]) => {
      setRegistrations(updated.filter((r) => r.eventId === Number(eventId)));
    });

    return () => {
      disconnectSocket("dashboard");
    };
  }, [eventId]);

  return <CheckinTable registrations={registrations} />;
}
