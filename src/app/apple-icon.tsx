import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b1be89",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            color: "#1c2414",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            marginTop: -6,
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size },
  );
}
