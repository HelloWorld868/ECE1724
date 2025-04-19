"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "./EventForm";
import { createEvent } from "@/lib/actions";

export default function CreateEventForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleAction = async (formData: FormData) => {
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });
    
    startTransition(async () => {
      try {
        const result = await createEvent(formData);

        if (result?.userId) {
          router.push(`/user/${result.userId}`);
        } else {
          setMessage("Event created successfully");
        }
      } catch (error) {
        if (error instanceof Error) {
          setMessage(error.message);
        }
      }
    });
  };

  return (
    <>
      <EventForm action={handleAction} setImageFiles={setImageFiles} imageFiles={imageFiles} />
      {message && <p className="text-sm">{message}</p>}
    </>
  );
}
