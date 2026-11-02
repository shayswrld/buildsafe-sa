import { redirect } from "next/navigation";

/**
 * Worker Hub root landing page.
 * Cleanly redirects to /worker/dashboard to satisfy intermediate breadcrumb routing
 * and prevent 404 hazards.
 */
export default function WorkerPage() {
  redirect("/worker/dashboard");
}
