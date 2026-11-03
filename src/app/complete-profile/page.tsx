import type { Metadata } from "next";
import CompleteProfile from "@/views/CompleteProfile";

export const metadata: Metadata = { title: "Complete your profile" };

export default function CompleteProfilePage() {
  return <CompleteProfile />;
}
