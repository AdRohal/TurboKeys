import type { Metadata } from "next";
import Leaderboard from "@/views/Leaderboard";

export const metadata: Metadata = {
  title: "Typing Speed Leaderboard",
  description: "See the fastest typists on TurboKeys. Browse the top WPM scores by test length and language, and see where you rank.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
