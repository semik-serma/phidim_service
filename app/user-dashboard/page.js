"use client";

import UserDashboardNewUI from "@/components/user-dashboard/UserDashboardNewUI";
import RoleGuard from "@/components/RoleGuard";

export default function UserDashboardPage({ initialTab = "dashboard" }) {
  return (
    <RoleGuard roles={["USER", "ADMIN"]}>
      <UserDashboardNewUI initialTab={initialTab} />
    </RoleGuard>
  );
}
