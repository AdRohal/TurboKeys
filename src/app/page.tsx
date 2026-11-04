import type { Metadata } from "next";
import Home from "@/views/Home";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return <Home />;
}
