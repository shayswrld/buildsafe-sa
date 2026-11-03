import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSignup } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, UserRole } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateSignup(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, phone, email, password, accountType } = validation.value;

    // Check if phone number already registered
    const existing = await prisma.user.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const role: UserRole =
      accountType === "BUILDER" ? "WORKER" : accountType === "DUAL" ? "DUAL" : "HOMEOWNER";

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Create user (profileCompletedAt is null until Stage 2 /profile/setup)
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        role,
        suburb: "Pending Profile Setup",
        city: "Johannesburg",
        avatarUrl: initials,
        tokenVersion: 0,
        profileCompletedAt: null,
      },
    });

    // Create JWT session cookie with pc: false
    const token = await signSession({
      sub: user.id,
      role: user.role as UserRole,
      pc: false,
      tv: user.tokenVersion || 0,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          profileCompleted: false,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { error: "Unable to register account. Please try again." },
      { status: 500 }
    );
  }
}
