import { memo } from "react";

interface SportFieldProps {
  sport: string;
  className?: string;
}

function FootballPitch() {
  return (
    <svg viewBox="0 0 680 440" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Pitch */}
      <rect x="0" y="0" width="680" height="440" rx="8" fill="hsl(145 60% 12%)" stroke="hsl(145 80% 30% / 0.4)" strokeWidth="2" />
      {/* Center line */}
      <line x1="340" y1="0" x2="340" y2="440" stroke="hsl(42 90% 55% / 0.3)" strokeWidth="1.5" />
      {/* Center circle */}
      <circle cx="340" cy="220" r="60" fill="none" stroke="hsl(42 90% 55% / 0.3)" strokeWidth="1.5" />
      <circle cx="340" cy="220" r="3" fill="hsl(42 90% 55% / 0.5)" />
      {/* Left penalty area */}
      <rect x="0" y="120" width="110" height="200" fill="none" stroke="hsl(42 90% 55% / 0.25)" strokeWidth="1.5" />
      <rect x="0" y="170" width="40" height="100" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1.5" />
      <circle cx="80" cy="220" r="3" fill="hsl(42 90% 55% / 0.4)" />
      {/* Right penalty area */}
      <rect x="570" y="120" width="110" height="200" fill="none" stroke="hsl(42 90% 55% / 0.25)" strokeWidth="1.5" />
      <rect x="640" y="170" width="40" height="100" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1.5" />
      <circle cx="600" cy="220" r="3" fill="hsl(42 90% 55% / 0.4)" />
      {/* Corner arcs */}
      <path d="M0,10 Q10,0 20,0" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1" />
      <path d="M660,0 Q670,0 680,10" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1" />
      <path d="M0,430 Q10,440 20,440" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1" />
      <path d="M660,440 Q670,440 680,430" fill="none" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="1" />
    </svg>
  );
}

function BasketballCourt() {
  return (
    <svg viewBox="0 0 500 440" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="500" height="440" rx="8" fill="hsl(25 40% 14%)" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="2" />
      {/* Half court line */}
      <line x1="250" y1="0" x2="250" y2="440" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1.5" />
      <circle cx="250" cy="220" r="50" fill="none" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1.5" />
      {/* Left three-point arc */}
      <path d="M0,80 Q140,220 0,360" fill="none" stroke="hsl(38 92% 50% / 0.25)" strokeWidth="1.5" />
      <rect x="0" y="150" width="120" height="140" fill="none" stroke="hsl(38 92% 50% / 0.25)" strokeWidth="1.5" />
      {/* Right three-point arc */}
      <path d="M500,80 Q360,220 500,360" fill="none" stroke="hsl(38 92% 50% / 0.25)" strokeWidth="1.5" />
      <rect x="380" y="150" width="120" height="140" fill="none" stroke="hsl(38 92% 50% / 0.25)" strokeWidth="1.5" />
      {/* Hoops */}
      <circle cx="50" cy="220" r="12" fill="none" stroke="hsl(0 72% 51% / 0.5)" strokeWidth="2" />
      <circle cx="450" cy="220" r="12" fill="none" stroke="hsl(0 72% 51% / 0.5)" strokeWidth="2" />
    </svg>
  );
}

function TennisCourt() {
  return (
    <svg viewBox="0 0 600 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="600" height="400" rx="8" fill="hsl(217 30% 14%)" stroke="hsl(217 70% 50% / 0.3)" strokeWidth="2" />
      {/* Court outline */}
      <rect x="60" y="40" width="480" height="320" fill="none" stroke="hsl(217 70% 50% / 0.35)" strokeWidth="2" />
      {/* Net */}
      <line x1="300" y1="40" x2="300" y2="360" stroke="hsl(0 0% 80% / 0.5)" strokeWidth="2" strokeDasharray="4,4" />
      {/* Service boxes */}
      <rect x="60" y="100" width="240" height="200" fill="none" stroke="hsl(217 70% 50% / 0.2)" strokeWidth="1" />
      <rect x="300" y="100" width="240" height="200" fill="none" stroke="hsl(217 70% 50% / 0.2)" strokeWidth="1" />
      <line x1="60" y1="200" x2="300" y2="200" stroke="hsl(217 70% 50% / 0.2)" strokeWidth="1" />
      <line x1="300" y1="200" x2="540" y2="200" stroke="hsl(217 70% 50% / 0.2)" strokeWidth="1" />
    </svg>
  );
}

function Octagon() {
  return (
    <svg viewBox="0 0 440 440" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="440" height="440" rx="8" fill="hsl(0 0% 8%)" />
      {/* Octagon */}
      <polygon
        points="130,20 310,20 420,130 420,310 310,420 130,420 20,310 20,130"
        fill="hsl(0 0% 12%)"
        stroke="hsl(0 72% 51% / 0.4)"
        strokeWidth="3"
      />
      {/* Inner circle */}
      <circle cx="220" cy="220" r="80" fill="none" stroke="hsl(0 72% 51% / 0.2)" strokeWidth="1.5" />
      {/* Center logo area */}
      <circle cx="220" cy="220" r="30" fill="hsl(0 72% 51% / 0.1)" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1" />
    </svg>
  );
}

function BaseballDiamond() {
  return (
    <svg viewBox="0 0 500 440" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="500" height="440" rx="8" fill="hsl(42 20% 12%)" stroke="hsl(42 90% 55% / 0.3)" strokeWidth="2" />
      {/* Infield diamond */}
      <polygon
        points="250,80 400,220 250,360 100,220"
        fill="hsl(30 40% 18%)"
        stroke="hsl(38 92% 50% / 0.3)"
        strokeWidth="2"
      />
      {/* Base paths */}
      <line x1="250" y1="80" x2="400" y2="220" stroke="hsl(0 0% 80% / 0.3)" strokeWidth="1.5" />
      <line x1="400" y1="220" x2="250" y2="360" stroke="hsl(0 0% 80% / 0.3)" strokeWidth="1.5" />
      <line x1="250" y1="360" x2="100" y2="220" stroke="hsl(0 0% 80% / 0.3)" strokeWidth="1.5" />
      <line x1="100" y1="220" x2="250" y2="80" stroke="hsl(0 0% 80% / 0.3)" strokeWidth="1.5" />
      {/* Bases */}
      <rect x="244" y="74" width="12" height="12" fill="hsl(0 0% 90%)" transform="rotate(45 250 80)" />
      <rect x="394" y="214" width="12" height="12" fill="hsl(0 0% 90%)" transform="rotate(45 400 220)" />
      <rect x="244" y="354" width="12" height="12" fill="hsl(0 0% 90%)" transform="rotate(45 250 360)" />
      <rect x="94" y="214" width="12" height="12" fill="hsl(0 0% 90%)" transform="rotate(45 100 220)" />
      {/* Pitcher mound */}
      <circle cx="250" cy="220" r="8" fill="hsl(30 40% 25%)" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1" />
    </svg>
  );
}

function HockeyRink() {
  return (
    <svg viewBox="0 0 600 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="600" height="300" rx="40" fill="hsl(210 30% 92%)" stroke="hsl(217 70% 50% / 0.4)" strokeWidth="2" />
      {/* Ice surface overlay */}
      <rect x="4" y="4" width="592" height="292" rx="38" fill="hsl(200 20% 95%)" />
      {/* Center line */}
      <line x1="300" y1="0" x2="300" y2="300" stroke="hsl(0 72% 51% / 0.5)" strokeWidth="3" />
      {/* Blue lines */}
      <line x1="200" y1="0" x2="200" y2="300" stroke="hsl(217 70% 50% / 0.5)" strokeWidth="2.5" />
      <line x1="400" y1="0" x2="400" y2="300" stroke="hsl(217 70% 50% / 0.5)" strokeWidth="2.5" />
      {/* Center circle */}
      <circle cx="300" cy="150" r="40" fill="none" stroke="hsl(217 70% 50% / 0.4)" strokeWidth="2" />
      <circle cx="300" cy="150" r="3" fill="hsl(217 70% 50% / 0.6)" />
      {/* Goals */}
      <rect x="15" y="120" width="8" height="60" rx="2" fill="hsl(0 72% 51% / 0.4)" />
      <rect x="577" y="120" width="8" height="60" rx="2" fill="hsl(0 72% 51% / 0.4)" />
      {/* Face-off circles */}
      <circle cx="100" cy="80" r="20" fill="none" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1.5" />
      <circle cx="100" cy="220" r="20" fill="none" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1.5" />
      <circle cx="500" cy="80" r="20" fill="none" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1.5" />
      <circle cx="500" cy="220" r="20" fill="none" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1.5" />
    </svg>
  );
}

function GenericField() {
  return (
    <svg viewBox="0 0 600 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="600" height="400" rx="8" fill="hsl(225 18% 10%)" stroke="hsl(42 90% 55% / 0.2)" strokeWidth="2" />
      <line x1="300" y1="0" x2="300" y2="400" stroke="hsl(42 90% 55% / 0.15)" strokeWidth="1.5" />
      <circle cx="300" cy="200" r="60" fill="none" stroke="hsl(42 90% 55% / 0.15)" strokeWidth="1.5" />
      <circle cx="300" cy="200" r="3" fill="hsl(42 90% 55% / 0.3)" />
    </svg>
  );
}

const FIELD_MAP: Record<string, () => JSX.Element> = {
  football: FootballPitch,
  soccer: FootballPitch,
  basketball: BasketballCourt,
  tennis: TennisCourt,
  mma: Octagon,
  ufc: Octagon,
  boxing: Octagon,
  baseball: BaseballDiamond,
  hockey: HockeyRink,
};

export const SportField = memo(function SportField({ sport, className = "" }: SportFieldProps) {
  const key = sport?.toLowerCase() || "football";
  const FieldComponent = FIELD_MAP[key] || GenericField;
  
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 z-10 pointer-events-none" />
      <FieldComponent />
    </div>
  );
});
