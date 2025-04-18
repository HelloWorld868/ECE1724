import CreateEventForm from "@/components/CreateEventForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CreateEvent(){
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;
  if (!user) redirect("/signin");

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-900 dark:text-gray-100 space-y-6">
    <h1 className="text-2xl font-bold">Create New Event</h1>

      <div className="space-y-4">
        <CreateEventForm />
      </div>
    </div>
  );
}