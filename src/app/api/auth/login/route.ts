import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSaPhone } from "@/lib/auth/validation";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, UserRole } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Phone number (or ID) and password are required." },
        { status: 400 }
      );
    }

    const cleanInput = String(identifier).trim();
    const normalizedPhone = normalizeSaPhone(cleanInput);

    // Find user by normalized phone, or exact phone string, or id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          normalizedPhone ? { phone: normalizedPhone } : { phone: cleanInput },
          { id: cleanInput },
        ],
      },
    });

    if (!user) {
      // Burn equal CPU time to prevent timing attacks
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your phone number and password." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your phone number and password." },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT session cookie
    const isProfileComplete = Boolean(user.profileCompletedAt);
    const token = await signSession({
      sub: user.id,
      role: (user.role as UserRole) || "HOMEOWNER",
      pc: isProfileComplete,
      tv: user.tokenVersion || 0,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profileCompleted: isProfileComplete,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
