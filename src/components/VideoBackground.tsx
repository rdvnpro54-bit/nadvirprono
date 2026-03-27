import { useEffect, useRef } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force load + play
    video.load();
    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Retry after interaction
        const onClick = () => {
          video.play().catch(() => {});
          document.removeEventListener("click", onClick);
        };
        document.addEventListener("click", onClick, { once: true });
      }
    };

    video.addEventListener("canplay", () => void tryPlay(), { once: true });
    void tryPlay();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          opacity: 0.35,
          filter: "saturate(0.85) brightness(0.65)",
        }}
        src="/bg-video.mp4"
      />

      {/* Subtle overlay to blend with dark theme */}
      <div className="absolute inset-0 bg-background/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/70" />
    </div>
  );
}
