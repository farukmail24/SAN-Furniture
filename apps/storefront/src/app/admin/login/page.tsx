import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Operations Gateway | SAN Furniture Staff Portal",
  description: "Secure terminal authentication for SAN Furniture staff operations suite.",
  robots: "noindex, nofollow",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
