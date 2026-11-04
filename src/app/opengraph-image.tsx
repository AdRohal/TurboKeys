import { ImageResponse } from "next/og";

export const alt = "TurboKeys: free typing speed test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KEYS = ["T", "U", "R", "B", "O"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#371931", color: "#ffca8d" }}>
        <div style={{ display: "flex", gap: 16 }}>
          {KEYS.map((k) => (
            <div key={k} style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "#704d7f", color: "#fff", fontSize: 54, fontWeight: 700, borderBottom: "8px solid #4b3355" }}>
              {k}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, marginTop: 48 }}>TurboKeys</div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 12, color: "#ddd2e2" }}>Free typing speed test. Live WPM, accuracy and a global leaderboard.</div>
      </div>
    ),
    size,
  );
}
