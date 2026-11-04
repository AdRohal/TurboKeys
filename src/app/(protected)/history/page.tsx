import type { Metadata } from "next";
import History from "@/views/History";

export const metadata: Metadata = { title: "History", robots: { index: false, follow: false } };

export default function HistoryPage() {
  return <History />;
}
