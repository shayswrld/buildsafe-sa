import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE, SessionClaims } from "@/lib/auth/session";

interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  suburb: string;
  city: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  profileCompletedAt: Date | null;
  tokenVersion: number;
  workerProfile: any | null;
}

/**
 * Reads and verifies the session token from cookies,
 * and fetches the fresh user record from the database.
 * Returns null if no valid session or user not found.
 */
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const claims: SessionClaims | null = await verifySession(token);
    if (!claims || !claims.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        workerProfile: {
          include: {
            certifications: true,
            company: {
              include: {
                roster: {
                  include: {
                    user: true,
                    certifications: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Invalidate session if token version was bumped (e.g., password changed or all sessions revoked)
    if (user.tokenVersion !== claims.tv) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Error in getSessionUser:", err);
    return null;
  }
}
