import { useRef, useEffect } from "react";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Ensure autoplay on iOS
    video.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ filter: "blur(1px) brightness(0.4)" }}
      >
        <source src="/videos/bg-ambient.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.65)" }}
      />
    </div>
  );
}
