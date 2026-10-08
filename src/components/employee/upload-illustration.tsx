"use client";

type Step = "tool" | "upload" | "analyze";

export function UploadIllustration({ step }: { step: Step }) {
  return (
    <div
      className="flex justify-center rounded-xl border border-border/70 bg-muted/30 px-4 py-5"
      aria-hidden
    >
      <svg
        viewBox="0 0 120 120"
        className="upload-illu size-[7.5rem] text-[var(--ink)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft plate */}
        <rect
          x="14"
          y="18"
          width="92"
          height="84"
          rx="18"
          className="fill-[color-mix(in_oklab,var(--brand)_28%,white)]"
        />

        {/* Document */}
        <g className={step === "upload" ? "upload-illu-doc-rise" : undefined}>
          <rect
            x="38"
            y="34"
            width="44"
            height="56"
            rx="6"
            className="fill-white stroke-[var(--brand-deep)]"
            strokeWidth="2"
          />
          <path
            d="M48 48h24M48 58h24M48 68h16"
            className="stroke-[color-mix(in_oklab,var(--brand-deep)_55%,transparent)]"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Tool step: plus/tag badge */}
        {step === "tool" ? (
          <g className="upload-illu-fade">
            <circle
              cx="86"
              cy="40"
              r="14"
              className="fill-[var(--brand)] stroke-[var(--brand-deep)]"
              strokeWidth="2"
            />
            <path
              d="M86 33v14M79 40h14"
              className="stroke-[var(--ink)]"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        ) : null}

        {/* Upload step: rising arrow + dashed flow */}
        {step === "upload" ? (
          <g>
            <path
              d="M60 86v-18"
              className="stroke-[var(--brand-deep)] upload-illu-dash"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
            <path
              d="M52 76l8-10 8 10"
              className="stroke-[var(--brand-deep)] upload-illu-fade"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse
              cx="60"
              cy="28"
              rx="18"
              ry="8"
              className="fill-[color-mix(in_oklab,var(--brand)_55%,white)] stroke-[var(--brand-deep)] upload-illu-fade"
              strokeWidth="1.5"
            />
          </g>
        ) : null}

        {/* Analyze step: scan line + sparkles */}
        {step === "analyze" ? (
          <g>
            <rect
              x="40"
              y="36"
              width="40"
              height="3"
              rx="1.5"
              className="fill-[var(--brand-deep)] upload-illu-scan"
            />
            <circle
              cx="84"
              cy="42"
              r="2.5"
              className="fill-[var(--brand-deep)] upload-illu-sparkle"
            />
            <circle
              cx="90"
              cy="54"
              r="1.8"
              className="fill-[var(--brand)] upload-illu-sparkle-delay"
            />
            <circle
              cx="32"
              cy="62"
              r="2.2"
              className="fill-[var(--brand-deep)] upload-illu-sparkle"
            />
            <circle
              cx="28"
              cy="48"
              r="1.5"
              className="fill-[var(--brand)] upload-illu-sparkle-delay"
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
