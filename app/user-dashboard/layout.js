import { requireRoles } from "@/lib/auth/guards";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function UserDashboardLegacyLayout({ children }) {
  await requireRoles(["USER", "ADMIN"]);
  return <>{children}</>;
}
