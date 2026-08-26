import LoginPage from "@/components/login/LoginPage";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign In | Phidim Service",
  description: "Sign in to Phidim Service to manage appointments, technicians, and local services in Panchthar.",
};

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center" />}>
      <LoginPage />
    </Suspense>
  );
}