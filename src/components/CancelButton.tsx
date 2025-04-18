"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CancelButton() {
  const router = useRouter();

  return (
    <Button variant="outline" onClick={() => router.back()}>
      Cancel
    </Button>
  );
}