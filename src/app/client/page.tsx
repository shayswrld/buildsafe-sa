import { redirect } from "next/navigation";

/**
 * Client Portal root landing page.
 * Cleanly redirects to /client/dashboard to satisfy intermediate breadcrumb routing
 * and prevent 404 hazards.
 */
export default function ClientPage() {
  redirect("/client/dashboard");
}
