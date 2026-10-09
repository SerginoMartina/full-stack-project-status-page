import React from "react";

export default function AnimatedWorldBackground() {
  return (
    <>
      <style>{`
        @keyframes world-drift {
          from { transform: translate3d(0, 0, 0) rotate(-4deg); }
          to { transform: translate3d(-18px, 10px, 0) rotate(4deg); }
        }
        @keyframes world-ping {
          0% { opacity: 0.65; transform: scale(0.45); }
          100% { opacity: 0; transform: scale(2.6); }
        }
        @keyframes world-route {
          to { stroke-dashoffset: -180; }
        }
        .world-globe {
          transform-origin: 72% 48%;
          animation: world-drift 24s ease-in-out infinite alternate;
        }
        .world-route {
          stroke-dasharray: 5 13;
          animation: world-route 12s linear infinite;
        }
        .world-ping {
          transform-box: fill-box;
          transform-origin: center;
          animation: world-ping 2.8s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .world-globe, .world-route, .world-ping { animation: none; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 75% 45%, #292b2d 0%, #191a1b 42%, #101112 100%)",
        }}
      >
        <svg
          viewBox="0 0 1440 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            inset: 0,
            opacity: 0.58,
          }}
        >
          <defs>
            <radialGradient id="globe-shade">
              <stop offset="0%" stopColor="#35383a" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#1a1c1e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0c0d0e" stopOpacity="0.88" />
            </radialGradient>
            <clipPath id="globe-clip">
              <circle cx="1040" cy="500" r="370" />
            </clipPath>
          </defs>
          <g className="world-globe" fill="none" stroke="#aeb2b4">
            <circle cx="1040" cy="500" r="370" strokeOpacity="0.26" />
            <g clipPath="url(#globe-clip)" strokeOpacity="0.2" strokeWidth="1">
              <ellipse cx="1040" cy="500" rx="370" ry="112" />
              <ellipse cx="1040" cy="500" rx="370" ry="230" />
              <ellipse cx="1040" cy="500" rx="130" ry="370" />
              <ellipse cx="1040" cy="500" rx="260" ry="370" />
              <path d="M670 500h740M704 370h672M704 630h672M824 220v560M960 145v710M1120 145v710M1256 220v560" />
              <path
                className="world-route"
                d="M748 545C835 350 932 336 1032 450S1218 606 1335 410"
                stroke="#e2e4e5"
                strokeOpacity="0.7"
                strokeWidth="1.5"
              />
              <path
                className="world-route"
                d="M770 625C873 700 1014 390 1125 350S1262 500 1320 585"
                stroke="#e2e4e5"
                strokeOpacity="0.52"
              />
            </g>
            <circle
              cx="1040"
              cy="500"
              r="370"
              fill="url(#globe-shade)"
              stroke="none"
            />
            {[
              [815, 440],
              [946, 381],
              [1032, 450],
              [1155, 520],
              [1260, 402],
              [1125, 350],
              [970, 605],
              [1210, 650],
            ].map(([cx, cy], index) => (
              <g key={`${cx}-${cy}`}>
                <circle
                  className="world-ping"
                  cx={cx}
                  cy={cy}
                  r="7"
                  stroke="#d9ddcf"
                  strokeOpacity="0.8"
                  style={{ animationDelay: `${index * 0.35}s` }}
                />
                <circle cx={cx} cy={cy} r="3.5" fill="#c8d8ae" stroke="none" />
              </g>
            ))}
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(16,17,18,0.38), rgba(16,17,18,0.12) 58%, rgba(16,17,18,0.28))",
          }}
        />
      </div>
    </>
  );
}
