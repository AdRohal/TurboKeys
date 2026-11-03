import type { Metadata } from "next";
import History from "@/views/History";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return <History />;
}
