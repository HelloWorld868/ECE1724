"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteEventButton({ eventid }: { eventid: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this event?");
    if (!confirmed) return;

    const eventIdNum = parseInt(eventid);
    if (isNaN(eventIdNum)) {
      alert("Invalid event ID");
      return;
    }

    const res = await fetch(`/api/events/manage/${eventIdNum}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      router.push("/events/manage");
    } else {
      const data = await res.json();
      alert("Failed to delete event: " + data.error);
    }
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
}