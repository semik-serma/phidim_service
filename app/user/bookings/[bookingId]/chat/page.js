import { notFound } from "next/navigation";
import { requireRoles } from "@/lib/auth/guards";
import RoleGuard from "@/components/RoleGuard";
import BookingChatPage from "@/components/chat/BookingChatPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking conversation | Phidim Service" };

export default async function ChatRoute({ params }) {
  await requireRoles(["USER", "ADMIN"]);
  const { bookingId } = await params;
  const id = Number(bookingId);
  if (!/^\d+$/.test(bookingId) || !Number.isSafeInteger(id) || id <= 0) notFound();
  return <RoleGuard roles={["USER", "ADMIN"]}><BookingChatPage bookingId={id} dashboard="/user/dashboard" /></RoleGuard>;
}
