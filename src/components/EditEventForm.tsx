"use client";

import { useState } from "react";
import { EventForm } from "@/components/EventForm";
import { Event } from "@prisma/client";

interface EditEventFormProps {
    event: Event;
    updateEvent: (formData: FormData) => Promise<void>;
}

export function EditEventForm({ event, updateEvent }: EditEventFormProps) {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    return (
        <EventForm 
            initialData={event} 
            action={updateEvent}
            setImageFiles={setImageFiles}
            imageFiles={imageFiles}
        />
    );
} 