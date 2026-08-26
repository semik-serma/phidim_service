"use client";

import AdminDashboardNewUI from "./AdminDashboardNewUI";
import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboardPage({ initialTab = "dashboard" }) {
  return (
    <RoleGuard roles={["ADMIN"]}>
      <AdminDashboardNewUI initialTab={initialTab} />
    </RoleGuard>
  );
}
