export function BrandLogo({ markOnly = false }: { markOnly?: boolean }) {
  const viewBox = markOnly ? "0 0 48 48" : "0 0 238 48";
  return (
    <svg
      className={`brand-logo${markOnly ? " brand-logo--mark-only" : ""}`}
      viewBox={viewBox}
      role={markOnly ? undefined : "img"}
      aria-hidden={markOnly ? true : undefined}
      aria-labelledby={markOnly ? undefined : "flowerpower-logo-title"}
    >
      {!markOnly && (
        <title id="flowerpower-logo-title">FlowerPower Botanical Studio</title>
      )}

      <g className="brand-logo-mark">
        <path
          className="logo-lotus-primary"
          d="M24 6.5C18.8 11.2 17.5 17.5 24 25c6.5-7.5 5.2-13.8 0-18.5Z"
        />
        <path
          className="logo-lotus-secondary"
          d="M22.8 26.7C20.6 17.5 15.7 13 10.2 12.5c-.5 7.7 3.7 13.3 12.6 16.3v-2.1ZM25.2 26.7C27.4 17.5 32.3 13 37.8 12.5c.5 7.7-3.7 13.3-12.6 16.3v-2.1Z"
        />
        <path
          className="logo-lotus-primary"
          d="M20.8 29.3C15.7 21.9 9.2 20 3.8 22.2c3.7 7.7 10.5 11.2 20.2 9.5 9.7 1.7 16.5-1.8 20.2-9.5-5.4-2.2-11.9-.3-17 7.1L24 32.7l-3.2-3.4Z"
        />
      </g>

      {!markOnly && (
        <>
          <text
            className="logo-word-primary"
            x="56"
            y="29.5"
            fontFamily="Avenir Next, Avenir, Segoe UI, sans-serif"
            fontSize="23"
            fontWeight="650"
            letterSpacing="-0.8"
          >
            Flower
            <tspan className="logo-word-accent" fontWeight="550">
              Power
            </tspan>
          </text>
          <text
            className="logo-tagline"
            x="58"
            y="41"
            fontFamily="Avenir Next, Avenir, Segoe UI, sans-serif"
            fontSize="6.5"
            fontWeight="700"
            letterSpacing="2.5"
          >
            BOTANICAL STUDIO
          </text>
        </>
      )}
    </svg>
  );
}
