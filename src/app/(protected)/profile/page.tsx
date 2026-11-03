import type { Metadata } from "next";
import Profile from "@/views/Profile";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <Profile />;
}
