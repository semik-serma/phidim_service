import { requireRoles } from "@/lib/auth/guards";
import { ROLES } from "@/lib/auth/roles";
import TechnicianSearchPage from "@/components/user-dashboard/TechnicianSearchPage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Book Service" };

export default async function UserBookServicePage({ searchParams }) {
  await requireRoles([ROLES.USER]);
  const params = await searchParams;
  return <TechnicianSearchPage initialNotes={typeof params?.notes === "string" ? params.notes : ""} />;
}
