import { memo } from "react";
import { motion } from "framer-motion";

interface Player {
  name: string;
  number: number;
  position: string;
}

interface FootballLineupProps {
  homeTeam: string;
  awayTeam: string;
  homePlayers: Player[];
  awayPlayers: Player[];
}

// Position-based mapping for real API data
const POSITION_MAP: Record<string, number> = {
  G: 0, GK: 0, Goalkeeper: 0,
  D: 1, DEF: 1, Defender: 1, CB: 1, LB: 1, RB: 1, LWB: 1, RWB: 1,
  M: 2, MID: 2, Midfielder: 2, CM: 2, CDM: 2, CAM: 2, LM: 2, RM: 2, DM: 2, AM: 2,
  F: 3, FW: 3, Forward: 3, ATT: 3, ST: 3, CF: 3, LW: 3, RW: 3, Attacker: 3,
};

function getPositionRow(pos: string): number {
  if (!pos) return 2;
  const upper = pos.toUpperCase().trim();
  return POSITION_MAP[upper] ?? 2;
}

function PlayerDot({ x, y, name, number, side, delay }: {
  x: number; y: number; name: string; number: number; side: "home" | "away"; delay: number;
}) {
  const color = side === "home" ? "bg-primary" : "bg-secondary";
  const textColor = side === "home" ? "text-primary-foreground" : "text-secondary-foreground";
  const borderColor = side === "home" ? "border-primary/50" : "border-secondary/50";
  const shortName = name.length > 8 ? name.slice(0, 7) + "." : name;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.04, duration: 0.3, type: "spring" }}
      className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${color} ${textColor} border-2 ${borderColor} text-[10px] sm:text-xs font-bold shadow-md`}>
        {number || "?"}
      </div>
      <span className="text-[8px] sm:text-[9px] font-medium text-foreground/80 text-center whitespace-nowrap max-w-[60px] truncate">
        {shortName}
      </span>
    </motion.div>
  );
}

function positionPlayers(players: Player[], side: "home" | "away"): { x: number; y: number; player: Player }[] {
  if (players.length === 0) return [];

  // Group by position row
  const rows: Player[][] = [[], [], [], []]; // GK, DEF, MID, ATT
  for (const p of players) {
    const row = getPositionRow(p.position);
    rows[row].push(p);
  }

  // If all players fell into same row (no position data), use 4-3-3 default
  const hasPositionData = rows.filter(r => r.length > 0).length > 1;
  if (!hasPositionData) {
    return generateDefaultFormation(players, side);
  }

  const positions: { x: number; y: number; player: Player }[] = [];
  const rowYs = side === "home"
    ? [8, 22, 36, 46]    // home top half
    : [92, 78, 64, 54];  // away bottom half

  for (let rowIdx = 0; rowIdx < 4; rowIdx++) {
    const rowPlayers = rows[rowIdx];
    if (rowPlayers.length === 0) continue;
    const y = rowYs[rowIdx];
    const spacing = 80 / (rowPlayers.length + 1);
    rowPlayers.forEach((player, i) => {
      positions.push({ x: 10 + spacing * (i + 1), y, player });
    });
  }

  return positions;
}

function generateDefaultFormation(players: Player[], side: "home" | "away"): { x: number; y: number; player: Player }[] {
  const formation = [[50], [20, 37, 63, 80], [30, 50, 70], [25, 50, 75]]; // 4-3-3
  const positions: { x: number; y: number; player: Player }[] = [];
  let pIdx = 0;
  formation.forEach((row, rowIdx) => {
    const yBase = side === "home" ? 10 + rowIdx * 22 : 90 - rowIdx * 22;
    row.forEach((xPos) => {
      if (pIdx < players.length) {
        positions.push({ x: xPos, y: yBase, player: players[pIdx] });
        pIdx++;
      }
    });
  });
  return positions;
}

function NoLineupMessage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 px-4 py-2.5 text-center">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
          📋 Composition non disponible
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          Les compos seront affichées ~1h avant le match
        </p>
      </div>
    </div>
  );
}

export const FootballLineup = memo(function FootballLineup({
  homeTeam, awayTeam, homePlayers, awayPlayers,
}: FootballLineupProps) {
  const hasLineup = homePlayers.length > 0 || awayPlayers.length > 0;

  if (!hasLineup) return <NoLineupMessage />;

  const homePositions = positionPlayers(homePlayers, "home");
  const awayPositions = positionPlayers(awayPlayers, "away");

  return (
    <div className="absolute inset-0 z-20">
      {/* Team labels */}
      <div className="absolute top-2 left-3 z-30">
        <span className="text-[9px] sm:text-[10px] font-bold text-primary bg-card/80 backdrop-blur-sm rounded px-1.5 py-0.5">
          {homeTeam}
        </span>
      </div>
      <div className="absolute bottom-2 right-3 z-30">
        <span className="text-[9px] sm:text-[10px] font-bold text-secondary bg-card/80 backdrop-blur-sm rounded px-1.5 py-0.5">
          {awayTeam}
        </span>
      </div>

      {/* Player count badge */}
      <div className="absolute top-2 right-3 z-30">
        <span className="text-[8px] font-medium text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-1.5 py-0.5 border border-border/30">
          {homePlayers.length + awayPlayers.length} joueurs
        </span>
      </div>

      {/* Players */}
      {homePositions.map(({ x, y, player }, i) => (
        <PlayerDot key={`h-${i}`} x={x} y={y} name={player.name} number={player.number} side="home" delay={i} />
      ))}
      {awayPositions.map(({ x, y, player }, i) => (
        <PlayerDot key={`a-${i}`} x={x} y={y} name={player.name} number={player.number} side="away" delay={i + 11} />
      ))}
    </div>
  );
});
