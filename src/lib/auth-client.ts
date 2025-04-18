import { createAuthClient } from "better-auth/react";

const signIn = async () => {
  const data = await authClient.signIn.social({
      provider: "google",
  })
}

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/auth",
});
