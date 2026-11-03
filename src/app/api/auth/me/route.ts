import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    // Exclude password hash and tokenVersion from client response
    const { passwordHash, tokenVersion, ...safeUser } = user as any;

    return NextResponse.json({
      authenticated: true,
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Error fetching session user:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
