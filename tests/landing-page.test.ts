import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { signSession, SESSION_COOKIE, SessionClaims } from "@/lib/auth/session";

describe("Landing Page & Middleware Integration Tests (tests/landing-page.test.ts)", () => {
  it("allows unauthenticated visitors to access root route '/' without redirection", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await middleware(req);

    // Should not redirect to /login
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated visitors to access public jobs route '/jobs' without redirection", async () => {
    const req = new NextRequest("http://localhost:3000/jobs");
    const res = await middleware(req);

    // Should not redirect to /login
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated access to protected client portal to /login?from=/client/dashboard", async () => {
    const req = new NextRequest("http://localhost:3000/client/dashboard");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeDefined();
    const url = new URL(location!);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("from")).toBe("/client/dashboard");
  });

  it("sanitizes protocol-relative open-redirect attempts on /login?from=//evil.com", async () => {
    const homeownerClaims: SessionClaims = {
      sub: "user_homeowner_lerato",
      role: "HOMEOWNER",
      pc: true,
      tv: 1,
    };
    const token = await signSession(homeownerClaims);

    const req = new NextRequest("http://localhost:3000/login?from=//evil.com", {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeDefined();
    const url = new URL(location!);
    // Must redirect to safe internal dashboard, NOT //evil.com
    expect(url.pathname).toBe("/client/dashboard");
    expect(url.hostname).toBe("localhost");
  });

  it("redirects authenticated homeowner visiting '/' to '/client/dashboard'", async () => {
    const homeownerClaims: SessionClaims = {
      sub: "user_homeowner_lerato",
      role: "HOMEOWNER",
      pc: true,
      tv: 1,
    };
    const token = await signSession(homeownerClaims);

    const req = new NextRequest("http://localhost:3000/", {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeDefined();
    const url = new URL(location!);
    expect(url.pathname).toBe("/client/dashboard");
  });

  it("redirects authenticated worker attempting to access '/client/dashboard' to worker hub with restriction notice", async () => {
    const workerClaims: SessionClaims = {
      sub: "user_worker_sipho",
      role: "WORKER",
      pc: true,
      tv: 1,
    };
    const token = await signSession(workerClaims);

    const req = new NextRequest("http://localhost:3000/client/dashboard", {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeDefined();
    const url = new URL(location!);
    expect(url.pathname).toBe("/worker/dashboard");
    expect(url.searchParams.get("notice")).toBe("client_access_restricted");
  });
});
