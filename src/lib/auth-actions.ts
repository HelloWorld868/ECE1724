'use client';

import { authClient } from "@/lib/auth-client";

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  try {
    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
      },
      {
        onRequest: () => {
          // Optional: show loading spinner
        },
        onSuccess: () => {
          // Handled in component
        },
        onError: (ctx) => {
          console.error("BetterAuth sign-up error:", ctx.error.message);
        },
      }
    );

    return {
      success: !error,
      message: error ? "Sign-up failed." : "Sign-up successful! Redirecting...",
      userId: data?.user?.id,
      data,
      error,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Unexpected error occurred.",
      error: err,
    };
  }
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
        rememberMe: true,
      },
      {
        onRequest: () => {
          // Optional: loading logic
        },
        onSuccess: () => {
          // can redirect in the component
        },
        onError: (ctx) => {
          console.error("Sign-in error:", ctx.error.message);
        },
      }
    );

    return {
      success: !error,
      message: error ? "Sign-in failed." : "Sign-in successful! Redirecting...",
      data,
      error,
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Unexpected error during sign-in.",
      error: err,
    };
  }
}