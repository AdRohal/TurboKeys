import type { Metadata } from "next";
import Account from "@/views/Account";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <Account />;
}
