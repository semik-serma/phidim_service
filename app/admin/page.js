import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminRootPage() {
  await requireAdmin();
  redirect("/admin/dashboard");
}
