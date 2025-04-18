"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function ManageAccountPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  // Fetch session info
  useEffect(() => {
    async function loadUser() {
      const session = await authClient.getSession();
      const user = session?.data?.user;

      if (!user) {
        router.push("/signin");
        return;
      }

      setUserId(user.id);
      setName(user.name || "");
    }

    loadUser();
  }, [router]);

  async function handleNameUpdate() {
    try {
      const res = await fetch("/api/useraccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId }),
      });

      if (!res.ok) throw new Error("Failed to update name");

      setMessage("Name updated successfully");
      setError("");
    } catch (err: any) {
      setMessage("");
      setError(err.message || "Something went wrong");
    }
  }

  const handleSubmit = async () => {
    const { error } = await authClient.forgetPassword({
      email,
      redirectTo: "http://localhost:3000/resetpassword",
    });

    if (error) {
      setMessage("Something went wrong.");
      console.error("Forgot password error:", error);
      
    } else {
      setMessage("If your account exists, a reset link has been sent.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Manage Your Account</h1>

      {/* Update Name */}
      <div className="mb-8 space-y-3">
        <h2 className="text-lg font-semibold">Update Name</h2>
        <input
          className="w-full px-4 py-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleNameUpdate}>Update Name</Button>
      </div>

      <hr className="my-6" />

      {/* Change Password */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Change Password</h2>

        <input
        type="email"
        placeholder="Input your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      />

        <Button
          onClick={handleSubmit}
        >
          Send Reset Link to Email
        </Button>
      </div>

      {/* Messages */}
      {(message || error) && (
        <div className={`mt-6 text-sm ${error ? "text-red-600" : "text-green-600"}`}>
          {error || message}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link href="/">
          <Button variant="outline" className="text-lg py-3 px-6"> Back to Home Page</Button>
        </Link>
      </div>
    </div>
  );
}
