import type { Metadata } from "next";
import CompleteProfile from "@/views/CompleteProfile";

export const metadata: Metadata = { title: "Complete your profile", robots: { index: false, follow: false } };

export default function CompleteProfilePage() {
  return <CompleteProfile />;
}
