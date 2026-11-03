import type { Metadata } from "next";
import Leaderboard from "@/views/Leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return <Leaderboard />;
}
