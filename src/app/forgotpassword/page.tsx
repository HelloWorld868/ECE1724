"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

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
    <div className="max-w-md mx-auto py-10 space-y-4">
      <h1 className="text-xl font-bold">Reset your password</h1>

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      />

      <Button
        onClick={handleSubmit}
      >
        Send Reset Link
      </Button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}