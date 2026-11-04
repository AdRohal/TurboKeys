import type { Metadata } from "next";
import FastThinking from "@/views/FastThinking";

export const metadata: Metadata = {
  title: "Fast Thinking: Mental Math Challenge",
  description: "A free 60 second mental math challenge. Solve each calculation, pick the right answer out of three, and build a streak as the questions get harder.",
  alternates: { canonical: "/fast-thinking" },
};

export default function FastThinkingPage() {
  return <FastThinking />;
}
