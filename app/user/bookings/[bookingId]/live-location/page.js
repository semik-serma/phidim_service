import { notFound } from "next/navigation";
import { requireRoles } from "@/lib/auth/guards";
import { ROLES } from "@/lib/auth/roles";
import RoleGuard from "@/components/RoleGuard";
import BookingLiveLocationPage from "@/components/user-dashboard/BookingLiveLocationPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Technician live location" };

export default async function LiveLocationRoute({ params }) {
  await requireRoles([ROLES.USER, ROLES.ADMIN]);
  const { bookingId } = await params;
  const id = Number(bookingId);
  if (!/^\d+$/.test(bookingId) || !Number.isSafeInteger(id) || id <= 0) notFound();
  return (
    <RoleGuard roles={["USER", "ADMIN"]}>
      <BookingLiveLocationPage key={id} bookingId={id} />
    </RoleGuard>
  );
}
