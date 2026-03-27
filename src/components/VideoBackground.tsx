import { useEffect, useRef } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay can be blocked briefly on some iOS states.
      }
    };

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
          opacity: 0.32,
          filter: "saturate(0.9) brightness(0.72)",
        }}
      >
        <source src="/videos/bg-ambient.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-background/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/20 to-background/80" />
    </div>
  );
}
