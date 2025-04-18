import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    //requireEmailVerification: true,
    sendResetPassword: async ({ user, url }, req) => {
      try {
        await sendEmail(user.email, "Reset your password", `Click here: ${url}`);
      } catch (err) {
        console.error("Send reset email failed:", err);
        throw new Error("Could not send reset email."); // This will cause 400
      }
    }
  },
  socialProviders: {
    google: { 
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  },
  redirectUrl: "/signin/callback",
});
