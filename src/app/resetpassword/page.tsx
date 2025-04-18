"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params?.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!token) {
      setError("Invalid or missing token.");
      return;
    }

    const { error } = await authClient.resetPassword({ token, newPassword });
    if (error) {
      setError(error.message || "Failed to reset password.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-4">
      <h1 className="text-xl font-bold">Reset Your Password</h1>

      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      />

      <Button onClick={handleReset}>Reset Password</Button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm">
          Password reset! Redirecting to sign in...
        </p>
      )}
    </div>
  );
}