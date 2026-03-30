import { memo } from "react";

export const NebulaBackground = memo(function NebulaBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep black base */}
      <div className="absolute inset-0" style={{ background: "#080810" }} />

      {/* Purple nebula */}
      <div
        className="nebula-orb nebula-orb-purple"
        style={{
          width: "45vw",
          height: "45vw",
          maxWidth: "500px",
          maxHeight: "500px",
          top: "5%",
          left: "-10%",
          animationDelay: "0s",
        }}
      />

      {/* Gold nebula */}
      <div
        className="nebula-orb nebula-orb-gold"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: "450px",
          maxHeight: "450px",
          bottom: "10%",
          right: "-5%",
          animationDelay: "4s",
        }}
      />

      {/* Secondary purple top-right */}
      <div
        className="nebula-orb nebula-orb-purple"
        style={{
          width: "30vw",
          height: "30vw",
          maxWidth: "350px",
          maxHeight: "350px",
          top: "40%",
          right: "10%",
          animationDelay: "8s",
          opacity: 0.3,
        }}
      />

      {/* Small gold center */}
      <div
        className="nebula-orb nebula-orb-gold"
        style={{
          width: "25vw",
          height: "25vw",
          maxWidth: "300px",
          maxHeight: "300px",
          top: "60%",
          left: "20%",
          animationDelay: "6s",
          opacity: 0.2,
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});
