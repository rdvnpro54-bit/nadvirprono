import { useEffect, useRef } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
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
          opacity: 0.55,
          filter: "saturate(1.1) brightness(0.85)",
        }}
        src="/bg-video.mp4"
      />

      {/* Light overlay — don't kill the video visibility */}
      <div className="absolute inset-0 bg-background/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-transparent to-background/50" />
    </div>
  );
}