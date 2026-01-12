import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { render } from "@react-email/components";
import { prisma } from "./prisma";
import { emailService } from "@/services/email-service";
import { PasswordResetEmail } from "@/emails/password-reset";

function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        // Fire-and-forget to prevent timing attacks
        void (async () => {
          try {
            const html = await render(
              PasswordResetEmail({
                resetUrl: url,
                userName: user.name || undefined,
                expiresInMinutes: 60,
              })
            );

            const text = `Reset your password by visiting: ${url}\n\nThis link expires in 60 minutes.\n\nIf you did not request this password reset, you can safely ignore this email.`;

            await emailService.sendEmail({
              to: user.email,
              subject: "Reset your SVGO JSX password",
              html,
              text,
            });
          } catch (error) {
            console.error("Failed to send password reset email:", error);
          }
        })();
      },
    },
    plugins: [nextCookies()],
  });
}

// Cache the auth instance
let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

// For backward compatibility - create auth lazily on first property access
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    // Bind functions to the auth instance
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
