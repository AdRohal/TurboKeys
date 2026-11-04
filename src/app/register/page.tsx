import type { Metadata } from "next";
import Register from "@/views/Register";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free TurboKeys account to save every typing test, track your WPM over time and join the global leaderboard.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <Register />;
}
