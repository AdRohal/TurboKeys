import type { Metadata } from "next";
import Login from "@/views/Login";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to TurboKeys with email, Google or GitHub to save your typing test results and climb the leaderboard.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <Login />;
}
