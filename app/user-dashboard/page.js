"use client";

import UserDashboardNewUI from "@/components/user-dashboard/UserDashboardNewUI";
import RoleGuard from "@/components/RoleGuard";

export default function UserDashboardPage() {
  return (
    <RoleGuard roles={["USER", "ADMIN"]}>
      <UserDashboardNewUI />
    </RoleGuard>
  );
}
