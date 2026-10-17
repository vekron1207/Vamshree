import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "vaamshri_customer_session";
const AUDIENCE = "customer";
const DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function createCustomerSession(customerId: string) {
  const token = await new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${DURATION_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATION_SECONDS,
  });
}

export async function destroyCustomerSession() {
  (await cookies()).delete(COOKIE_NAME);
}

async function readCustomerId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    // The audience check keeps admin tokens (same secret) from working here
    const { payload } = await jwtVerify(token, secretKey(), { audience: AUDIENCE });
    return typeof payload.customerId === "string" ? payload.customerId : null;
  } catch {
    return null;
  }
}

// The signed-in customer, looked up fresh so a deleted account loses access
// immediately. passwordHash is deliberately not selected.
export async function getCurrentCustomer() {
  const id = await readCustomerId();
  if (!id) return null;
  return prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
}

export type CurrentCustomer = NonNullable<Awaited<ReturnType<typeof getCurrentCustomer>>>;
