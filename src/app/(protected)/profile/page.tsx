import type { Metadata } from "next";
import Profile from "@/views/Profile";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return <Profile />;
}
