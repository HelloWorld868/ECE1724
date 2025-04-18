// lib/google-signin.ts
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

export async function handleGoogleSignIn() {
  try {
    await authClient.signIn.social({ provider: "google" });
  } catch (err) {
    console.error("Google sign-in failed:", err);
    throw err;
  }
}