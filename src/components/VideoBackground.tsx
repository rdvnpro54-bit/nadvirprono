import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // On mobile, reduce quality impact by pausing when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0 }
    );

    video.load();
    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        document.addEventListener(
          "click",
          () => void video.play().catch(() => {}),
          { once: true }
        );
      }
    };

    video.addEventListener("canplay", () => {
      setIsLoaded(true);
      void tryPlay();
    }, { once: true });

    void tryPlay();
    observer.observe(video);

    return () => observer.disconnect();
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
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          opacity: isLoaded ? (isMobile ? 0.4 : 0.55) : 0,
          filter: isMobile
            ? "saturate(0.8) brightness(0.4) hue-rotate(10deg)"
            : "saturate(0.9) brightness(0.5) hue-rotate(10deg)",
        }}
        src="/bg-video.mp4"
      />

      {/* Overlay adapté mobile/desktop */}
      <div
        className="absolute inset-0"
        style={{
          background: isMobile
            ? "hsl(228 25% 4% / 0.55)"
            : "hsl(228 25% 4% / 0.40)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isMobile
            ? "linear-gradient(to bottom, hsl(228 25% 4% / 0.4), transparent 40%, hsl(228 25% 4% / 0.7))"
            : "linear-gradient(to bottom, hsl(228 25% 4% / 0.2), transparent 30%, hsl(228 25% 4% / 0.5))",
        }}
      />
    </div>
  );
}