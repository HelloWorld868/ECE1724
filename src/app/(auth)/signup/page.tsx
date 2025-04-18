'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { handleGoogleSignIn } from "@/lib/google-signin";

export default function SignUpPage() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const router = useRouter();

  async function handleSignUp(formData: FormData) {
    const result = await signUpWithEmail(formData);
    setMessage(result.message);
    setIsError(!result.success);

    if (result.success) {
      setTimeout(() => {
        router.push("/signin");
      }, 1000);
    } else {
      setErrorDetails(result.error);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow rounded">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        User Sign Up
      </h1>
      <form action={handleSignUp} className="space-y-4">
        <label className="block text-sm font-medium">Email:</label>
        <input
          type="email"
          name="email"
          required
          className="border p-2 w-full rounded"
        />
        <label className="block text-sm font-medium">Password:</label>
        <input
          type="password"
          name="password"
          required
          className="border p-2 w-full rounded"
        />
        <label className="block text-sm font-medium">Name:</label>
        <input
          type="text"
          name="name"
          required
          className="border p-2 w-full rounded"
        />
        <div className="flex justify-center pt-2">
          <Button type="submit">Sign Up</Button>
        </div>
      </form>
      <div className="flex items-center justify-center my-6">
        <div className="border-t w-full" />
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="border-t w-full" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async () => {
          try {
            await handleGoogleSignIn();
          } catch (err) {
            setMessage("Google sign-in failed.");
            setIsError(true);
          }
        }}
      >
        Sign in with Google
      </Button>
      {message && (
        <div className={`mt-4 ${isError ? 'text-red-500' : 'text-green-600'}`}>
          <p className="text-sm font-medium">{message}</p>
          {isError && errorDetails && (
            <div className="mt-2 text-xs bg-red-50 p-2 rounded">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
