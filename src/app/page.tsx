import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  const user = session?.user;
  if (user) {
    console.log("Found user:", user);
    redirect(`/user/${user.id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="mb-4 text-2xl font-bold leading-none tracking-tight text-gray-900 md:text-3xl lg:text-4xl dark:text-white">
        Event Management System
      </h1>
      <nav className="space-x-4">
        <Link
          href="/signup"
          className="inline-block px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition duration-200"
        >
          Sign Up
        </Link>
        <Link
          href="/signin"
          className="inline-block px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition duration-200"
        >
          Sign In
        </Link>
      </nav>
    </div>
  );
}
